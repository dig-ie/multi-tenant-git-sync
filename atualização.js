const simpleGit = require("simple-git");
const git = simpleGit();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function configureGit(urlClienteComTokenGithub, clienteBranch) {
  try {
    await git.addConfig("user.name", "seu-usuario");
    await git.addConfig("user.email", "seu-e-mail");
    console.log("Configuração do usuário Git concluída.");

    if (urlClienteComTokenGithub) {
      await git
        .removeRemote("origin")
        .catch(() => console.log("Remote origin não existe, continuando..."));
      await git.addRemote("origin", urlClienteComTokenGithub);
      console.log("Novo remote origin configurado com sucesso.");

      console.log(
        `Verificando se a branch ${clienteBranch} existe localmente...`
      );

      // Monta a URL completa para o fetch com o token incluído
      const urlComToken = `https://${GITHUB_TOKEN}@${
        urlClienteComTokenGithub.split("https://")[1]
      }`;

      // Fetch para garantir que as referências remotas estejam atualizadas
      try {
        await git.fetch(urlComToken);
      } catch (fetchError) {
        if (fetchError.message.includes("credential-gcloud.sh")) {
          console.log(
            "Aviso: Problema detectado com 'credential-gcloud.sh', ignorando o erro..."
          );
        } else if (
          fetchError.message.includes("Password for") &&
          fetchError.message.includes("No such device or address")
        ) {
          console.log(
            "Erro ao autenticar no repositório remoto. Verifique o token ou as permissões."
          );
          throw new Error("Falha ao autenticar no repositório remoto.");
        } else {
          throw fetchError;
        }
      }

      try {
        // Verifica se a branch existe localmente
        const branchList = await git.branch();

        if (!branchList.all.includes(clienteBranch)) {
          console.log(
            `Branch ${clienteBranch} não existe localmente, criando...`
          );
          await git.checkoutLocalBranch(clienteBranch); // Cria a branch se não existir
        } else {
          console.log(
            `Branch ${clienteBranch} existe localmente, fazendo checkout...`
          );

          // Descarta as mudanças locais sem usar stash
          await git.add(".");
          await git.commit("Salvando alterações", ".");
          await git.checkout(clienteBranch); // Faz checkout na branch existente
          await git.reset(["--hard"]); // Descarta as alterações locais (limpa a working directory)
        }
      } catch (err) {
        throw err;
      }
    }
  } catch (error) {
    console.error("Erro ao configurar o Git:", error);
    throw error;
  }
}

// Branch main = bot - atualizada
async function sincronizarComAMain(clientBranchName, urlClienteComTokenGithub) {
  try {
    // Monta a URL completa para o fetch com o token incluído
    const urlComToken = `https://${GITHUB_TOKEN}@${
      urlClienteComTokenGithub.split("https://")[1]
    }`;

    // Descarta as mudanças locais antes de buscar as atualizações
    await git.reset(["--hard"]); // Garantir que não há alterações locais

    console.log("Fazendo fetch das alterações da branch main...");
    await git.fetch(urlComToken);

    console.log("Merge da branch main...");
    await git.merge([
      "origin/main",
      "--allow-unrelated-histories",
      "--strategy=recursive",
      "--strategy-option=theirs",
      "--no-ff",
      "-m",
      "Commit de atualização do BOT.",
    ]);

    console.log("Merge realizado com sucesso.");

    console.log(`Forçando push para a branch ${clientBranchName}...`);
    await git.push("origin", clientBranchName, { "--force": null });

    console.log("Sincronização e push concluídos com sucesso.");
  } catch (error) {
    console.error("Erro ao sincronizar e forçar push da branch:", error);

    // Em caso de erro, tenta continuar automaticamente
    if (
      error.message.includes("conflict") ||
      error.message.includes("CONFLICTS")
    ) {
      console.log("Conflitos detectados, tentando resolver automaticamente...");

      await git.raw(["checkout", "--theirs", "."]); // Resolve os conflitos
      await git.add("./*"); // Marca os arquivos como resolvidos
      await git.commit("Merge automático resolvido");

      console.log("Conflitos resolvidos automaticamente.");
    }

    // Forçar push
    console.log("Forçando push para a branch cliente...");
    await git.push("origin", clientBranchName, { "--force": null }); //
  }
}

async function executarFluxoDeAtualização(
  urlClienteComTokenGithub,
  nomeBranchCliente
) {
  await configureGit(urlClienteComTokenGithub, nomeBranchCliente);
  await sincronizarComAMain(nomeBranchCliente, urlClienteComTokenGithub);
}

async function webhookReceiver(req, res) {
  const linkSoltoCliente = req.query.linkRepositorio;
  const nomeDaBranchCliente = req.query.nomeBranch;

  const linkCompletoCliente = `https://${GITHUB_TOKEN}@${linkSoltoCliente}`;

  try {
    console.log("====> Pedido de atualização recebido!");
    console.log("Chamando serviço de atualização...");

    await executarFluxoDeAtualização(linkCompletoCliente, nomeDaBranchCliente);
    res.status(200).send("Atualização concluída com sucesso.");
  } catch (error) {
    console.error("Erro ao processar o webhook:", error);
    res.status(500).send("Erro ao processar a atualização."); //
  }
}

module.exports = {
  webhookReceiver,
};
