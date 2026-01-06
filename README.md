## Caminhos da aplicação.

Na pasta protected e public temos as telas inicias e telas funcionais do software onde irão aparecer ao usuário primeiramente.

# ConfigHora
tela resposavel pela configuração do valor da hora é criada com um "export default function" comum com retorno em html e tailwind e na formação dos components principais como card, usamos prontos do shadcn. e nele é implementada a regra do formulario de envio dos dados. " <HoraForm /> "

# HoraForm
temos uma interface <HoraFormProps> que serve para tipar os props que o component horaform pode receber. No caso desse componente existe uma prop opcional que na verdade é uma função que retornada nada (void) apenas para dizer ao "pai" que algo deu certo ou não.

---

# Barra de Pesquisa de Serviços

## Localização
`components/servicos/servico-list.tsx`

## Como Funciona

A barra de pesquisa filtra os serviços **pelo nome** em tempo real, sem fazer novas requisições à API.

### Fluxo de Funcionamento

```
1. Usuário digita no input
         ↓
2. onChange dispara → setBusca(valor)
         ↓
3. Estado "busca" atualiza
         ↓
4. React re-renderiza o componente
         ↓
5. servicosFiltrados recalcula com .filter()
         ↓
6. Apenas serviços que contêm o texto aparecem
```

### Código Principal

```tsx
// Estado que armazena o texto digitado
const [busca, setBusca] = useState("")

// Filtra os serviços comparando o nome (case-insensitive)
const servicosFiltrados = servicos.filter(servico =>
    servico.nome.toLowerCase().includes(busca.toLowerCase())
)
```

### Por que toLowerCase()?

Para a busca não diferenciar maiúsculas de minúsculas:

```javascript
// SEM toLowerCase:
"API".includes("api")  // false - não encontra

// COM toLowerCase:
"API".toLowerCase().includes("api".toLowerCase())
"api".includes("api")  // true - encontra!
```

## Por que Filtrar no Frontend?

Esta é a **melhor abordagem** para este caso porque:

| Vantagem | Explicação |
|----------|------------|
| **Resposta instantânea** | Não precisa esperar requisição HTTP |
| **Sem carga no servidor** | API não é chamada a cada tecla digitada |
| **Dados já carregados** | Os serviços já estão em memória |
| **Simplicidade** | Apenas 3 linhas de código |
| **UX superior** | Feedback imediato ao usuário |

### Quando usar filtro no Backend?

- Quando há **milhares de registros** (paginação)
- Quando os dados **não cabem na memória**
- Quando precisa de **busca avançada** (fuzzy search, relevância)

No nosso caso, um usuário típico terá dezenas ou centenas de serviços, então filtrar no frontend é ideal.

## Componentes Utilizados

- `Input` - componente de input do Shadcn UI
- `Search` - ícone de lupa do Lucide React

## Exemplo Visual

```
┌─────────────────────────────────────────┐
│  🔍 [ Buscar serviço pelo nome...    ]  │  ← Input de busca
└─────────────────────────────────────────┘
                    │
                    ▼
         servicosFiltrados.map()
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    ┌───────┐   ┌───────┐   ┌───────┐
    │ Card  │   │ Card  │   │ Card  │     ← Apenas cards filtrados
    └───────┘   └───────┘   └───────┘
```