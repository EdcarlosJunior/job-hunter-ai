# 🤖 JobHunter-AI

O **JobHunter-AI** é um assistente inteligente desenvolvido em Node.js que utiliza a API do **Google Gemini 3 Flash** para automatizar a triagem de vagas de emprego. O objetivo principal é filtrar vagas de nível Júnior real, descartando as famosas "vagas sênior mascaradas" no LinkedIn.

---

## 🚀 Funcionalidades

* **Extração Automatizada:** Integração com dados de scrapers de vagas (Apify/LinkedIn).
* **Filtro de Senioridade (Blacklist):** Camada inicial que descarta cargos de gestão ou alta senioridade sem gastar tokens de API.
* **Análise Semântica com IA:** O Gemini 3 analisa a descrição da vaga para detectar requisitos abusivos (ex: pedir 5 anos de experiência para Júnior).
* **Cálculo de Match Técnico:** Avaliação automática de compatibilidade com a stack (React, Node.js e SQL).
* **Controle de Fluxo (Rate Limit):** Implementação de delay inteligente para respeitar os limites da API gratuita do Google AI Studio.

## 🛠️ Tecnologias Utilizadas

* **Runtime:** [Node.js](https://nodejs.org/)
* **IA:** [Google Gemini 3 Flash Preview](https://ai.google.dev/)
* **Gerenciamento de API:** `@google/generative-ai`
* **Ambiente:** `dotenv` para proteção de chaves.
