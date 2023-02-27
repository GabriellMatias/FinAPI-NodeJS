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

/*pode colocar o midleware de duas formas
app.get('/statement', MIDLEWARE, (request, response)
OU
app.use(MIDLEWARE) */
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


app.listen(3333)