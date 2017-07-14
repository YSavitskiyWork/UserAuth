const Sequelize = require("sequelize");
const express = require("express");
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const exprjwt = require("express-jwt");
const app = express();
const crypto = require("crypto");
const jsonParser = bodyParser.json()
const key = "key";
const hashAddition = "glavriba";    

const sequelize = new Sequelize('user_auth_test', "postgres", "1",
    {
        dialect: 'postgres'
    });

sequelize.authenticate()
    .then(() => 
    {
        //console.log("Connection has been established successfully");
    })
    .catch(err => 
    {
        console.error('Unable to connect to the DB');
    });

const Users = sequelize.define('users',
    {
        email: {
            type: Sequelize.STRING, 
            unique: true, 
            validate: {
                isEmail: true,
                notEmpty: true
            }
        }, 
        password: {
                type: Sequelize.STRING(64),
                validate: {
                    notEmpty: true
                }
            }
    },
    {
        timestamps: false
    });

const ToDos = sequelize.define('todolists',
    {
        user_id: {
            type: Sequelize.INTEGER,
            validate: {
                notEmpty: true
            }
        },
        todo: {
            type: Sequelize.STRING(250),
            validate: {
                notEmpty: true
            }
        },
        isDone:{
            type: Sequelize.BOOLEAN,
            defaultValue: 0
        },
        inArchive:{
            type: Sequelize.BOOLEAN,
            defaultValue: 0
        }

    });
User.hasMany(ToDos, )

Users.sync();
ToDos.sync();

app.use(bodyParser.urlencoded({ extended: false }));

//app.use("/apic", jwt({/**/}));

app.post('/api/singin', jsonParser, function(req, res)
    {
        Users.findOne({
            where: {
                email: req.body.email, 
                password: hashing(req.body.password)
            }
        })
        .then(dbUser => {
                const token = jwt.sign({id: dbUser.id}, key);                
                res.send(token);}
            )
        .catch(err => {res.send("Wrong email or password.\n")});
    });

app.post('/api/singup', jsonParser, function(req, res)
    {
        //res.send(hashing(req.body.password));
       Users.create({
            email: req.body.email,
            password: hashing(req.body.password)
            }
        )        
        .then(() => {res.send("User has been created successfully!\n");})
        .catch(err => {res.status(500).json(err);
        });
    });

app.post('/api/todo/add', jsonParser, function(req, res)
    {
        for(let i=0; i<req.body.todo.length(); i+=1)
        {
            ToDos.create({
            user_id: jwt.decode(req.body.token).id,
            todo: req.body.todo[i]
            })
            .then(() => {res.send("ToDo add successfully!\n")})
            .catch(err => {res.send("Something goes wrong...\n")});
        }
    });

app.get('/api/todo/list', jsonParser, function(req, res)
    {
        let user_id = jwt.decode(req.body.token).id;

        res.send(()=>{return ToDos.findAll({
            where: {user_id: user_id}
        })
        .then(dbUsers => {

        })

        }); 
    });

    
app.listen(3000, function()
    {
        //console.log("Example app listening on port 3000!");
    });


function hashing(data)
{
    const hash = crypto.createHash('sha256');
    hash.update(hashAddition);
    var hashStr = "";

    hash.on('readable', () => {
        h_data = hash.read();
        if(h_data)
            hashStr = h_data.toString('hex');
    })
    hash.end();

    return hashStr;
}