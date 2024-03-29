const bcrypt = require('bcryptjs')

module.exports = {
    register: async (req, res) => {
        const db = req.app.get('db')
        const { email, password, name, profile_img } = req.body
        const found = await db.find_user([email])
        if (+found[0].count === 1) {
            return res.status(409).send({ message: 'email already in use' })
        }
        
        const user_id = await db.add_user({ name, email, profile_img: `https://robohash.org/${email}` })

        const salt = bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(password, salt)
        db.add_hash({people_id: user_id[0].people_id, hash})

        req.session.user = {people_id: user_id[0].people_id, email, name, profile_img}
        res.status(201).send({message: 'logged in', user: req.session.user})
    },
    login: async (req, res) => {
        const db = req.app.get('db')
        const {email, password} = req.body
        const found = await db.find_user([email])
        if (+found[0].count === 0){
            return res.status(401).send({message: 'account does not exist'})
        }
        const foundUser = await db.find_hash([email])
        const {hash, people_id, name, profile_img} = foundUser[0]
        const result = bcrypt.compareSync(password, hash)
        if (!result){
            return res.status(401).send({message: 'password incorrect'})
        }
        req.session.user = {people_id, email, name, profile_img}
        res.status(200).send({message: 'logged in', user: req.session.user})
    },
    logout: (req, res) => {
        req.session.destroy()
        res.sendStatus(200)
    }
}