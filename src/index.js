const { response } = require('express');
const express = require('express');
const { v4 } = require('uuid')

const app = express()
const customers = []

/*Avisa para o express utilizar Json */
app.use(express.json())


/*Tipos de parametros para receber:

  Route Params = url/PARAMETRO vem junto com a URL
  Query Params = vem pela rota para fazer paginacao ou filtros URL?page=1&filtro=algo
  body Params = objetos para fazer a insercao ou alteracao de dados (JSON) URL/

*/


/*Middleware */
/*pode colocar o midleware de duas formas
app.get('/statement', MIDLEWARE, (request, response)
OU
app.use(MIDLEWARE) */
function verifyExistsAccountCPF(request, response, next) {
  /*Next define se o midleware vai continuar ou vai barrar */
  const { cpf } = request.headers
  const customer = customers.find(customer => customer.cpf === cpf)

  if (!customer) {
    return response.status(400).json({ error: 'Customer not found' })
  }
  request.customer = customer
  return next() /*Contina a aplicacao */
}

/*Calculado saldo da acc */
function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount
    } else {
       return acc - operation.amount
    }
  }, 0)
  return balance
}

/*Realizando extrato bancario */
app.get('/statement', verifyExistsAccountCPF, (request, response) => {

  const { customer } = request

  return response.status(200).json(customer.statment)
})

/* Possibilitando a criacao de uma conta */
app.post('/account', (request, response) => {
  const { cpf, name } = request.body

  /*Verificando se usuario ja tem conta */
  const customerAlreadyExists = customers.some((costumer) => costumer.cpf === cpf)
  if (customerAlreadyExists) {
    return response.status(400).json({ error: 'Customer already exists' })
  }


  customers.push({
    cpf,
    name,
    id: v4(),
    statment: []
  })

  return response.status(201).send()
})

/* DEIXEI O REQUEST SEMPRE ANTES DO RESPONSE */
/*Depositando */
app.post('/deposity', verifyExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body
  const { customer } = request
  const statmentOperation = {
    description,
    amount,
    createdAt: new Date(),
    type: 'credit'
  }
  customer.statment.push(statmentOperation)
  return response.status(201).send({ message: 'Desposity made successfully' })
})

/*Realizando Saque */
app.post('/withdraw', verifyExistsAccountCPF, (request, response) => {
  const { amount } = request.body
  const { customer } = request

  const balance = getBalance(customer.statment)

  if (balance < amount) {
    return response.status(400).json({ error: 'Insufficient funds' })
  }
  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: 'debit'
  }
  customer.statment.push(statementOperation)

  return response.status(201).send({ message: 'Withdrawal made successfully' })

})

/* Pegando extrato pela data*/
app.get('/statement/date', verifyExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { date } = request.query
  const dateFormated = new Date(date + ' 00:00')
  const statement = customer.statment.filter(statement => statement.createdAt.toDateString() === new Date(dateFormated).toDateString())

  return response.status(200).json(statement)
})

/*Modificando nome da conta */
app.put('/account', verifyExistsAccountCPF, (request, response) => {
  const { name } = request.body
  const { customer } = request
  customer.name = name
  return response.status(200).send({ message: 'Changes made successfully' })
})

/*Printando dados do cliente */
app.get('/account', verifyExistsAccountCPF, (request, response) => {
  const { customer } = request
  return response.status(200).json(customer)
})

/*Deletando acc */
app.delete('/account', verifyExistsAccountCPF, (request, response) => {
  const { customer } = request
  customers.splice(customer, 1)

  return response.status(200).send({ message: 'Account deleted successfully', customers })
})


app.get("/balance", verifyExistsAccountCPF, (request, response) => {
  const { customer } = request
  const balance = getBalance(customer.statment)

  return response.json(balance)

})

app.listen(3333)