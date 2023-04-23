import { db } from "../database/database.connection.js"
import bcrypt, { compareSync } from "bcrypt"
import { v4 as uuid } from "uuid"
import { shemaLogin, userSchema } from "../schemas/user.schema.js"

export async function singup(req, res) {
  const { email, username, password } = req.body

  const validation = userSchema.validate(req.body, { abortEarly: false })
  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message)
    return res.status(422).send(errors)
  }

  try {
    const userExist = await db.collection("users").findOne({ email })
    if (userExist) return res.status(409).send("E-mail já cadastrado")

    const hash = bcrypt.hashSync(password, 10)

    await db.collection("users").insertOne({ email, username, password: hash })
    res.sendStatus(201)
  } catch (err) {
    res.status(500).send(err.message)
  }
}

export async function singin(req, res) {
  const { email, password } = req.body

  const validation = shemaLogin.validate(req.body, { abortEarly: false })
  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message)
    return res.status(422).send(errors)
  }

  try {
    const user = await db.collection("users").findOne({ email })
    if (!user) return res.status(404).send("E-mail não cadastrado")

    const correctPassword = bcrypt.compareSync(password, user.password)
    if (!correctPassword) return res.status(401).send("Senha incorreta")

    const token = uuid()
    await db.collection("sessions").insertOne({ token, userID: user._id })
    res.send(token)
  } catch (err) {
    res.status(500).send(err.message)
  }
}
