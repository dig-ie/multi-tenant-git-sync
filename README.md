# 🔄 Git Branch Sync for SaaS Clients

Este projeto em **Node.js** foi desenvolvido para automatizar a **sincronização de múltiplas branches** de um repositório Git, sendo aplicado em um cenário real de **SaaS multi-tenant**, onde o núcleo do sistema (bot de WhatsApp com integração OpenAI) evolui constantemente e precisa ser propagado para diferentes versões personalizadas por cliente.

## 📦 Contexto

O repositório possui a branch `main` que representa o **núcleo do bot**, e múltiplas outras branches derivadas, como `cliente-1`, `cliente-2`, etc., que incluem **customizações específicas por cliente**.

Cada cliente possui sua branch implantada separadamente no **Google Cloud Run**, e ao realizar um novo commit na `main`, um **webhook GitHub** aciona esse sistema, que automaticamente:

1. Acessa a branch do cliente.
2. Faz `merge` das últimas alterações da `main`.
3. Resolve conflitos automaticamente, priorizando os arquivos da `main`.
4. Faz `push` forçado para a branch do cliente.
5. Isso dispara um novo deploy no Cloud Run, mantendo todos os ambientes atualizados com o núcleo mais recente.

## 🚀 Tecnologias Utilizadas

- **Node.js**
- **simple-git** (interface Git via Node)
- **GitHub Webhooks**
- **Google Cloud Run (GCP)** para deploys automatizados

## 🛠️ Funcionalidades

- Configura o Git no container com nome e email.
- Remove e adiciona remotes dinamicamente usando token do GitHub.
- Faz `fetch` remoto da branch do cliente.
- Cria a branch localmente se não existir.
- Realiza merge com a `main`, usando:
  - `--allow-unrelated-histories`
  - `--strategy=recursive --strategy-option=theirs`
- Resolve conflitos automaticamente com `--theirs`.
- Realiza `push --force` para garantir que as atualizações sejam aplicadas.

## 🧠 Demonstração de Conhecimento

Este projeto demonstra experiência prática com:

- Arquitetura SaaS com múltiplos ambientes derivados de um núcleo central.
- Integração CI/CD usando GitHub + Cloud Run.
- Manipulação de Git programaticamente via Node.js.
- Automação de merge e deploys para ambientes segregados.
- Gestão de tokens e autenticação Git em produção.
- Manipulação avançada de conflitos com Git via código.

## 📌 Como Usar

O sistema foi exposto como um endpoint HTTP em um container Node.js.

### Requisição para atualização de uma branch específica:

```
GET /atualizacao-bot?linkRepositorio=github.com/usuario/repositorio.git&nomeBranch=cliente-1
```

> O webhook do GitHub é configurado para disparar essa requisição sempre que houver push na `main`.

### Exemplo de chamada interna:

```js
executarFluxoDeAtualização(
  "https://ghp_TOKEN@github.com/dig-ie/nome-do-repo.git",
  "cliente-1"
);
```

## 🔐 Segurança

- Token GitHub é embutido via variável de ambiente (`GITHUB_TOKEN`) para autenticação.
- Recomenda-se configurar esse token como **segredo** e não deixar hardcoded (feito aqui apenas por simplicidade demonstrativa).

## 🧩 Estrutura do Projeto

```
📦 raiz
 ┣ 📜 atualizacao.js       // Código principal de sincronização
 ┣ 📜 package.json         // Dependências (simple-git, etc)
 ┣ 📜 README.md            // Este arquivo
```

## 📈 Possibilidades de Expansão

- Adição de logs persistentes em banco.
- Interface visual para status das branches.
- Suporte a múltiplas estratégias de merge (não só `--theirs`).
- Verificação de integridade pós-deploy (smoke tests).

## 👨‍💻 Autor

Desenvolvido por [@dig-ie](https://github.com/dig-ie), programador full-stack com experiência prática em arquiteturas SaaS, automações Git e deploys serverless na Google Cloud Platform.
