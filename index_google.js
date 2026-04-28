const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

async function processarVagas() {
    const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms)); 
    
    try {
        if (!fs.existsSync('./vagas_google.json')) {
            console.error("❌ Erro: O arquivo 'vagas_google.json' não foi encontrado na pasta!"); 
            return;
        }

        const dadosBrutos = fs.readFileSync('./vagas_google.json', 'utf8');
        
        // Como o seu arquivo é uma lista direta [], o JSON.parse já retorna as vagas
        const vagas = JSON.parse(dadosBrutos);

        console.log(`🔍 Iniciando análise de ${vagas.length} vagas encontradas...`); 
        const listaAprovadas = [];

        for (const vaga of vagas) {
            const titulo = (vaga.title || "").toLowerCase(); 
            const blacklist = [
            'senior', 'sr', 'lead', 'especialista', 'gerente', 'staff', 'principal', 
            'manager', 'sales', 'vendas', 'diretor', 'director', 'coordenador', 
            'coordinator', 'talent', 'rh', 'recruiter', 'marketing', 'copywriting', 
            'assistant', 'estágio', 'intern', 'vendedor', 'administrativo', 'scrum master', 'agilista'
            ]; // Mantive os termos de gestão e senioridade alta, mas liberei o Pleno.

            if (blacklist.some(termo => titulo.includes(termo))) {
                console.log(`⏩ Ignorada (Nível Alto): ${vaga.title}`); 
                continue;
            }

            console.log(`🤖 Analisando: ${vaga.title}...`); 

            const descricao = vaga.description || vaga.jobDescription || "Sem descrição disponível";

            const localidade = (vaga.location || "").toLowerCase();
            const noTitulo = (vaga.title || "").toLowerCase().includes('são paulo');
            const naDescricao = (vaga.description || "").toLowerCase().includes('são paulo');
            if (!localidade.includes('são paulo') && !localidade.includes('sp') && !noTitulo && !naDescricao) {
                console.log(`⏩ Ignorada (Fora de SP): ${vaga.title}`);
                continue;
            }

            const prompt = `
            Você é um recrutador técnico especialista em detectar "vagas mascaradas".
            Analise se a vaga abaixo é compatível com um desenvolvedor de nível JÚNIOR ou PLENO, ou se é um SÊNIOR MASCARADO.

            Critérios para Descarte (Sênior Mascarado):
            - Pede mais de 5 anos de experiência profissional específica.
            - Exige liderança de grandes times, gestão de orçamento ou definição solitária de arquiteturas complexas.
            - Lista de tecnologias abusiva que mistura muitas áreas (ex: Mobile nativo + DevOps avançado + Data Science).

            Critérios de Aceitação:
            - Vagas de nível Júnior ou Pleno.
            - Foco em tecnologias como React, Node.js e SQL.

            Responda ESTRITAMENTE em formato JSON (sem markdown):
            {
                "veredito": "APROVADA" ou "REPROVADA",
                "motivo": "uma frase curta explicando",
                "match_tecnico": 0 a 100 (baseado em React, Node e SQL)
            }

            Vaga: ${vaga.title}
            Descrição: ${descricao.substring(0, 2000)}
        `;

            try {
                const result = await model.generateContent(prompt); // 
                const response = result.response.text();
                const jsonString = response.replace(/```json|```/g, "").trim();
                const analise = JSON.parse(jsonString); 

                if (analise.veredito === "APROVADA" && analise.match_tecnico >= 60) {
                    console.log(`✅ MATCH! -> ${vaga.title} (${vaga.companyName || 'Empresa'})`);
                    listaAprovadas.push({ ...vaga, analiseIA: analise }); 
                } else {
                    console.log(`❌ DESCARTADA -> Motivo: ${analise.motivo}`); 
                }

                // --- O DELAY DEVE FICAR AQUI ---
                // Espera 5 segundos após cada chamada bem-sucedida para evitar o erro 429
                await esperar(5000); 

            } catch (apiError) {
                if (apiError.status === 429) {
                    console.warn("⏳ Limite atingido. Aguardando 30 segundos para continuar...");
                    await esperar(30000); // Pausa maior se o Google reclamar do limite
                } else {
                    console.error("⚠️ Erro na chamada da IA:", apiError.message);
                }
            }
        }

        fs.writeFileSync('./match_final_google.json', JSON.stringify(listaAprovadas, null, 2));
        console.log(`\n✨ Tudo pronto! Resultados salvos em match_final_google.json`);

    } catch (error) {
        console.error("⚠️ Ocorreu um erro no processamento:", error); 
    }
}

processarVagas();