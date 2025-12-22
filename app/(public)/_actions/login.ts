"use server"

import { signIn } from '../../../lib/auth'

export async function handleRegister(provider: string) {
  await signIn(provider, { redirectTo: "/dashboard" })
}

//roda no servidor - provider espera o nome do provedor de autenticação (google, github, etc)
//recebe o nome do provedor -> chama a função signIn -> se sucesso redireciona para o dashboard