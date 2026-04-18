# 💻 Bruno Salustiano | Portfólio Full Stack

![Status](https://img.shields.io/badge/Status-Concluído_e_em_Produção-success?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

Este repositório contém o código-fonte do meu portfólio profissional. Este projeto foi desenvolvido utilizando uma **arquitetura moderna e desacoplada**, focada em performance, escalabilidade e adoção das melhores práticas de mercado para aplicações full stack.

🌍 **[Acesse o Portfólio ao vivo aqui](https://brunoferreirasalustiano.github.io/6-Portifolio-Bruno/)**

---

## 🏗️ Arquitetura Web Desacoplada (Decoupled Architecture)

Diferente de arquiteturas tradicionais e monolíticas, este sistema utiliza um modelo desacoplado, onde a interface (Frontend), o servidor de lógica (Backend API) e o banco de dados funcionam de forma independente, comunicando-se via APIs seguras.

### Visualização do Fluxo de Dados

Abaixo, um diagrama explicando o caminho que os dados percorrem desde o envio do formulário pelo usuário até a persistência segura no banco de dados.

![Diagrama da Arquitetura do Sistema](./img/Animação-fluxo-site.gif)

### Explicação do Fluxo (Log de Eventos):

* **🌐 GitHub Pages (Frontend):** Recebe a interação do usuário. É hospedado globalmente via CDN, garantindo que o site carregue instantaneamente em qualquer lugar do mundo, sem latência.

* **⚙️ Railway (Backend API): É o cérebro da operação. Diferente de hospedagens convencionais, a Railway oferece alta performance sem "cold start" (tempo de espera para o servidor acordar). Gerencia a validação rigorosa de dados com Zod, orquestra e-mails via Resend API e comunica-se com a camada de persistência.

* **🗄️ Supabase (PostgreSQL):** É a camada de persistência. Funciona de forma independente do servidor de API, garantindo que os dados de contato sejam guardados com segurança e integridade em um banco de dados relacional.

---

## ✨ Funcionalidades Técnicas Principais

* **Validação de Dados:** Implementação do `Zod` no backend, criando um schema rigoroso para garantir a integridade e segurança dos dados de contato (evitando injeção de scripts e spam de dados inválidos).
* **Notificações Transacionais:** Integração com o serviço **Resend API** para envio automático de e-mails de notificação ao proprietário do portfólio assim que um novo contato é submetido.
* **Persistência Segura:** Configuração de tabelas e persistência de dados no **Supabase (PostgreSQL)**, funcionando como um banco de dados autônomo e seguro.
* **Segurança (CORS):** Backend blindado para aceitar requisições `POST` apenas da origem autorizada (o domínio do GitHub Pages).

---
## 🛡️ Segurança & Proteção de Dados (Nível de Produção)

A API e o Frontend foram blindados com práticas rigorosas de segurança, visando resiliência contra ataques, bots e abusos:

* **Rate Limiting & Trust Proxy:** Proteção ativa contra ataques de Spam e força bruta. A API utiliza `express-rate-limit` configurada para identificar IPs reais por trás do proxy reverso do Render, bloqueando acessos abusivos (ex: mais de 5 requisições em 15 minutos).
* **CORS Rigoroso:** Configuração estrita de *Cross-Origin Resource Sharing*. O backend processa requisições `POST` e preflights `OPTIONS` exclusivamente do domínio oficial da aplicação e do ambiente local de desenvolvimento, rejeitando origens desconhecidas.
* **Prevenção contra HTML Injection (XSS):** Todos os dados inseridos pelo usuário são sanitizados no backend. A API faz o *escape* de caracteres especiais (como `<` e `>`) antes do envio pelo Resend, mitigando injeções de scripts maliciosos no corpo do e-mail.
* **Honeypot Anti-Bot:** Implementação de um campo oculto (`_gotcha`) no formulário. Se preenchido (comportamento típico de bots de varredura), a requisição é descartada silenciosamente pelo servidor, economizando processamento e cota de banco de dados.
* **Row Level Security (RLS):** As tabelas no Supabase (PostgreSQL) possuem políticas de segurança ativadas no nível da linha. O client público (anônimo) possui apenas permissão restrita de inserção (`INSERT`), bloqueando qualquer tentativa de leitura, edição ou deleção de dados.
* **Resiliência de UX (Timeout Handling):** O frontend utiliza `AbortController` na requisição HTTP. Caso o servidor sofra lentidão (ex: cold-start de instâncias em nuvem), a requisição é cancelada após 8 segundos, liberando a interface do usuário e exibindo um feedback claro de erro de conexão.

## 👨‍💻 Autor

**Bruno Salustiano**
Desenvolvedor Full Stack especializado na construção de aplicações web funcionais, escaláveis e seguras, do banco de dados à interface UI/UX.

* **LinkedIn:** [https://www.linkedin.com/in/bfs-bruno/](https://www.linkedin.com/in/bfs-bruno/)
* **Localização:** Campinas, SP - Brasil
