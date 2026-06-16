# Dentix - Frontend

Interface web do Dentix, um sistema de gestão para clínica odontológica desenvolvido como projeto final do programa Wise Start.

O frontend foi construído em Angular e consome uma API REST em Java Spring Boot. A aplicação permite administrar pacientes, dentistas, especialidades, consultas, usuários, relatórios, notificações, perfil, autenticação em dois fatores e lançamentos financeiros gerados a partir dos agendamentos.

## Aplicação em produção

```text
https://dentix.app.br
```

O deploy foi realizado em uma instância AWS EC2 usando Docker, Docker Compose, Nginx e Certbot. Em produção, as chamadas iniciadas por `/api` são encaminhadas pelo Nginx para o backend Spring Boot.

## Tecnologias

- Angular 21
- TypeScript
- RxJS
- Angular Router
- Angular Forms
- Angular CDK
- Angular Material
- Font Awesome
- FullCalendar
- Chart.js
- SCSS
- Vitest
- Prettier

## Funcionalidades principais

- Login com autenticação JWT.
- Controle de acesso por perfil de usuário.
- Dashboard com indicadores da clínica.
- Gerenciamento de usuários administrativos e dentistas.
- Cadastro, listagem, edição, pesquisa e arquivamento de pacientes.
- Cadastro, listagem, edição, pesquisa e arquivamento de dentistas.
- Cadastro e listagem de especialidades.
- Vinculação de dentistas com múltiplas especialidades.
- Agenda de consultas com FullCalendar.
- Criação, edição, reagendamento, finalização e cancelamento de consultas.
- Cancelamento de consulta com motivo obrigatório.
- Relatórios com filtros por paciente, dentista, especialidade, usuário responsável e período.
- Paginação em telas de listagem.
- Consumo da API REST com `HttpClient`.
- Interceptor para envio automático do token JWT.
- Guardas de rota para proteger páginas autenticadas e páginas exclusivas de admin.

## Extras implementados

- Tema claro e escuro com persistência da preferência do usuário.
- Perfil do usuário com dados da conta e foto de perfil.
- Upload, alteração e remoção de foto de perfil.
- Autenticação em dois fatores com código de 6 dígitos.
- QR Code para configuração do aplicativo autenticador.
- Notificações internas para solicitações e retornos.
- Solicitação de alteração de dados pelo usuário.
- Área administrativa para responder solicitações de alteração.
- Menu superior com avatar e ações de perfil.
- Sidebar recolhível.
- Dashboard com gráficos em Chart.js.
- Agenda semanal adaptada para dentistas.
- Pesquisa dinâmica com `signal` em campos de busca.
- Busca de paciente e dentista dentro do formulário de consulta.
- Envio de mensagem pelo WhatsApp após agendamento.
- Módulo financeiro com lançamentos gerados a partir de consultas.
- Tela de preferências do usuário.
- Tratamento visual para tema escuro em tabelas, formulários, cards e modais.

## Requisitos

- Node.js
- npm
- Angular CLI
- API backend do Dentix em execução

Em desenvolvimento, o projeto usa proxy do Angular para encaminhar as chamadas de `/api` para:

```ts
http://localhost:8080
```

A URL base utilizada pelo frontend está configurada em:

```text
src/app/core/api.ts
```

O proxy local está configurado em:

```text
proxy.conf.json
```

## Instalação

Clone o repositório:

```bash
git clone <url-do-repositorio-frontend>
```

Acesse a pasta do projeto:

```bash
cd gestao-dental
```

Instale as dependências:

```bash
npm install
```

Execute o servidor de desenvolvimento:

```bash
npm start
```

Acesse a aplicação em:

```text
http://localhost:4200
```

## Build

Para gerar a versão de build:

```bash
npm run build
```

Os arquivos gerados ficam na pasta:

```text
dist/gestao-dental
```

## Docker

O frontend possui um `Dockerfile` multi-stage:

1. Usa Node.js para instalar dependências e gerar o build Angular.
2. Usa Nginx para servir os arquivos estáticos.
3. Encaminha chamadas iniciadas por `/api` para o serviço `backend` na porta `8080`.

Para construir a imagem manualmente:

```bash
docker build -t dentix-frontend .
```

Para executar apenas o frontend em Docker, ele precisa estar na mesma rede do backend ou ter o Nginx ajustado para apontar para a URL correta da API.

## Deploy

A aplicação em produção está hospedada em:

```text
https://dentix.app.br
```

Arquitetura utilizada:

```text
Internet
  |
  v
Nginx na EC2 com HTTPS
  |
  v
Container frontend Nginx
  |
  v
/api -> Container backend Spring Boot
  |
  v
Container MySQL
```

O backend e o MySQL não ficam expostos publicamente. Apenas as portas `80` e `443` da EC2 são abertas para acesso externo.

## Testes

Para executar os testes configurados no projeto:

```bash
npm test
```

## Estrutura principal

```text
src/app/core
```

Serviços centrais, autenticação, interceptors, guards, tema, perfil e notificações.

```text
src/app/features
```

Páginas e funcionalidades do sistema, como login, dashboard, consultas, pacientes, dentistas, especialidades, relatórios, financeiro, perfil e solicitações.

```text
src/app/layouts
```

Layouts da aplicação, incluindo layout autenticado e layout de login.

## Integração com o backend

O frontend consome os endpoints da API Spring Boot do Dentix. Para utilizar o sistema corretamente, o backend deve estar em execução antes do login.

Fluxo básico:

1. O usuário acessa a tela de login.
2. O frontend envia as credenciais para a API.
3. A API retorna o token JWT ou solicita a etapa de 2FA quando configurada.
4. O token é salvo no navegador.
5. O interceptor adiciona o token automaticamente nas requisições protegidas.
6. As rotas são liberadas conforme o perfil do usuário.

## Autor

Lorenzo Carneiro Andreoli
