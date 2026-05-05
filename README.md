# Job Hunter AI 🤖

Protótipo de automação para busca e análise inteligente de vagas no LinkedIn utilizando IA. O sistema filtra oportunidades em São Paulo, verifica compatibilidade técnica e armazena os resultados de forma incremental.

## 🚀 Funcionalidades Atuais

*   **Extração de Dados**: Integração com dados obtidos via Apify/LinkedIn[cite: 1, 2].
*   **Análise Inteligente**: Uso do Google Gemini (gemini-3-flash-preview) para avaliar o match técnico das descrições.
*   **Filtros Customizados**: Blacklist de cargos (Sênior, Gerente, etc.) e filtro geográfico para São Paulo/SP.
*   **Persistência Incremental**: Armazenamento de resultados em JSON com verificação de duplicidade para evitar gastos desnecessários de API.
*   **Configuração Dinâmica**: Controle de limites e caminhos de arquivos via variáveis de ambiente (.env)

## 🛠️ Tecnologias

*   Node.js[cite: 2]
*   Google Generative AI (Gemini API)
*   Dotenv (Gestão de ambiente)

## ⚙️ Como Configurar

1. Clone o repositório.
2. Instale as dependências: `npm install`.
3. Crie um arquivo `.env` baseado no `.env.example` e insira suas chaves de API
4. Execute o script: `node index_linkedin.js`.