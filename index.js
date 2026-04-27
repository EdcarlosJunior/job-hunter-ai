const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

async function processarVagas() {
    const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms)); // [cite: 4]
    
    try {
        if (!fs.existsSync('./vagas.json')) {
            console.error("❌ Erro: O arquivo 'vagas.json' não foi encontrado na pasta!"); // [cite: 5]
            return;
        }

        const dadosBrutos = fs.readFileSync('./vagas.json', 'utf8');
        const vagas = JSON.parse(dadosBrutos);

        console.log(`🔍 Iniciando análise de ${vagas.length} vagas encontradas...`); // [cite: 7]
        const listaAprovadas = [];

        for (const vaga of vagas) {
            const titulo = (vaga.title || "").toLowerCase(); // [cite: 8]
            const blacklist = [
                'senior', 'sr', 'lead', 'especialista', 'gerente', 'staff', 'principal', 
                'manager', 'sales', 'vendas', 'diretor', 'director', 'coordenador', 
                'coordinator', 'talent', 'rh', 'recruiter', 'marketing', 'copywriting', 
                'assistant', 'estágio', 'intern', 'vendedor', 'administrativo', 'scrum master', 'agilista'
            ]; // [cite: 9]

            if (blacklist.some(termo => titulo.includes(termo))) {
                console.log(`⏩ Ignorada (Nível Alto): ${vaga.title}`); // [cite: 10]
                continue;
            }

            console.log(`🤖 Analisando: ${vaga.title}...`); // [cite: 13]

            const descricao = vaga.description || vaga.jobDescription || "Sem descrição disponível"; // [cite: 12]
            const prompt = `Analise se a vaga abaixo é para um Desenvolvedor JÚNIOR REAL ou um SÊNIOR MASCARADO... [omitido para brevidade]`; // [cite: 14-19]

            try {
                const result = await model.generateContent(prompt); // 
                const response = result.response.text();
                const jsonString = response.replace(/```json|```/g, "").trim();
                const analise = JSON.parse(jsonString); // [cite: 21]

                if (analise.veredito === "JUNIOR" && analise.match_tecnico >= 60) {
                    console.log(`✅ MATCH! -> ${vaga.title} (${vaga.companyName || 'Empresa'})`);
                    listaAprovadas.push({ ...vaga, analiseIA: analise }); // [cite: 21, 22]
                } else {
                    console.log(`❌ DESCARTADA -> Motivo: ${analise.motivo}`); // [cite: 23]
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

        fs.writeFileSync('./match_final.json', JSON.stringify(listaAprovadas, null, 2)); // [cite: 24]
        console.log(`\n✨ Tudo pronto! ${listaAprovadas.length} vagas passaram no seu filtro.`); // [cite: 25]

    } catch (error) {
        console.error("⚠️ Ocorreu um erro no processamento:", error); // [cite: 26]
    }
}

processarVagas();