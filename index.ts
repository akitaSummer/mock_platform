import express from 'express'
import cors from 'cors'
import { createUser, findUserByName } from './dao/users'
import { StatusCode, RespType } from './types'
import './db/mongo'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cors())

app.get('/signup', async (request, response) => {
    try {
        console.log(1234)
        const userList = await findUserByName('admin')
        if (userList.length > 0) {
            return response.send({
                StatusCode: StatusCode.TargetExist,
                StatusMessage: 'user exist'
            })
        }
        const user = await createUser('admin', 'admin')
        return response.send({
            StatusCode: StatusCode.Success,
            StatusMessage: 'create success',
            data: user
        })
    } catch(e) {
        console.log(e)
        return response.send({
            StatusCode: StatusCode.CreateFailed,
            StatusMessage: 'create user failed'
        })
    }
    
})

app.listen(4000, () => {
    console.log('App listening on port 4000!')
})