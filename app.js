const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
// const config = require(__dirname+'/config');

const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static("public"));

// let username = process.env.USERNAME;
// let password = process.env.PASSWORD;

// if(username == null || username == "" || username == "User") {
//     username = config.username;
// }
// if(password == null || password == "") {
//     password = config.password;
// }

// console.log(config.username);
// console.log(config.password);

mongoose.connect("mongodb+srv://" + username + ":" + password + "@cluster0.fbqex.mongodb.net/todolistDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

var start = 0;

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model('Item',itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to cross off an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems){
        if(foundItems.length === 0 && start === 0) {
            Item.insertMany(defaultItems, function(err) {
                if(err) {
                    console.log(err);
                } else {
                    start++;
                    // console.log("Succesfully saved default items!");
                } 
            });
            res.redirect("/");
        } else {
            res.render("list", {listTitle : "Today", newListItems: foundItems});
        }
    });
});

app.post("/",function(req, res) {

    const itemName = req.body.newItem;
    const listNameAdd = req.body.listNameAdd;

    const item = new Item({
        name: itemName
    });
    
    if(listNameAdd === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listNameAdd}, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listNameAdd);
        });
    }
   
});

app.post("/delete", function(req, res) {

    const checkedItemId = req.body.checkbox;
    const listNameDel = req.body.listNameDel;

    if(listNameDel === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if(!err) {
                // console.log("Succesfully deleted checked item!");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listNameDel}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err) {
                res.redirect("/"+listNameDel);
            }
        });
    }
    
});

app.get("/:customListName", function(req, res) {
    
    customListName = _.lowerCase(req.params.customListName);
    
    List.findOne({name: customListName}, function(err, foundList) {
        if(!err) {
            if(!foundList) {
                // if list not found, then create it
                    const list = new List({
                    name: customListName,
                    // items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            } else {
                // if it's found then, render it
                res.render("list", {listTitle : foundList.name, newListItems: foundList.items});
            }
        }
    });   
});

app.get("/about", function(req,res) {
    res.render('about');
});

let port = process.env.PORT;
if(port == null || port == "") {
    port = 3000;
}

app.listen(port, function() {
    console.log("Server has started successfully..");
});
