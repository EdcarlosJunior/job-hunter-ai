const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

async function processarVagas() {
    const arquivoPath = process.env.FILE_INPUT_LINKEDIN;
    const matchFinalPath = process.env.FILE_OUTPUT_MATCH;

    // 1. Validação de Arquivo de Entrada
    if (!fs.existsSync(arquivoPath)) {
        console.error("❌ Erro: O arquivo de vagas não foi encontrado!");
        return;
    }

    // 2. Carregamento do Histórico (Para evitar duplicados e acumular resultados)
    let listaAprovadas = [];
    if (fs.existsSync(matchFinalPath)) {
        try {
            listaAprovadas = JSON.parse(fs.readFileSync(matchFinalPath, 'utf8'));
            console.log(`💾 Histórico carregado: ${listaAprovadas.length} vagas já salvas.`);
        } catch (e) {
            console.warn("⚠️ Erro ao ler histórico. Iniciando nova lista.");
        }
    }

    // 3. Preparação das Vagas Atuais
    const dadosBrutos = fs.readFileSync(arquivoPath, 'utf8');
    const todasAsVagas = JSON.parse(dadosBrutos);
    const limiteVagas = parseInt(process.env.VAGAS_BATCH_SIZE) || 50; 
    const vagasParaAnalisar = todasAsVagas.slice(0, limiteVagas);

    const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms)); 
    console.log(`🔍 Analisando lote de ${vagasParaAnalisar.length} vagas...`);

    try {
        for (const vaga of vagasParaAnalisar) {
            const titulo = (vaga.title || "").toLowerCase();
            const empresa = vaga.companyName || "Empresa Desconhecida";

            // --- FILTRO 1: Blacklist (Rápido/Local) ---
            const blacklist = ['senior', 'sr', 'lead', 'gerente', 'diretor', 'estágio', 'vendedor'];
            if (blacklist.some(termo => titulo.includes(termo))) {
                console.log(`⏩ Ignorada (Blacklist): ${vaga.title}`);
                continue;
            }

            // --- FILTRO 2: Já Processada anteriormente? ---
            const jaExiste = listaAprovadas.some(v => v.title === vaga.title && v.companyName === vaga.companyName);
            if (jaExiste) {
                console.log(`⏭️ Pulando: ${vaga.title} na ${empresa} (Já está no histórico)`);
                continue;
            }

            // --- FILTRO 3: Localidade (São Paulo) ---
            const localidade = (vaga.location || "").toLowerCase();
            const descricaoBase = (vaga.description || vaga.descriptionText || "").toLowerCase();
            if (!localidade.includes('são paulo') && !localidade.includes('sp') && !descricaoBase.includes('são paulo')) {
                console.log(`⏩ Ignorada (Fora de SP): ${vaga.title}`);
                continue;
            }

            // --- ANÁLISE VIA IA ---
            console.log(`🤖 Analisando via IA: ${vaga.title}...`); 
            const descricao = vaga.description || vaga.descriptionText || "";

            const prompt = `Responda ESTRITAMENTE em formato JSON: {"veredito": "APROVADA" ou "REPROVADA", "motivo": "frase curta", "match_tecnico": 0-100} Vaga: ${vaga.title} Descrição: ${descricao.substring(0, 1500)}`;

            try {
                const result = await model.generateContent(prompt); 
                const response = result.response.text();
                const jsonString = response.replace(/```json|```/g, "").trim();
                const analise = JSON.parse(jsonString); 

                if (analise.veredito === "APROVADA" && analise.match_tecnico >= 60) {
                    console.log(`✅ NOVO MATCH! -> ${vaga.title}`);
                    
                    listaAprovadas.push({ 
                        title: vaga.title,
                        companyName: vaga.companyName,
                        location: vaga.location,
                        url: vaga.applyUrl || vaga.url,
                        analiseIA: analise 
                    });
                    
                    fs.writeFileSync(matchFinalPath, JSON.stringify(listaAprovadas, null, 2));
                } else {
                    console.log(`❌ DESCARTADA -> Motivo: ${analise.motivo}`); 
                }

                await esperar(5000); // Evitar 429 da API

            } catch (apiError) {
                console.error("⚠️ Erro na API Gemini:", apiError.message);
                await esperar(10000);
            }
        }
        console.log(`\n✨ Concluído! Total no histórico: ${listaAprovadas.length}`); 
    } catch (error) {
        console.error("⚠️ Erro geral no loop:", error); 
    }
}

processarVagas();