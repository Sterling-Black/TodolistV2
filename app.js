require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const ejs = require("ejs");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect(process.env.MONGODB_URL, {useNewUrlParser: true});


const itemSchema = {
  name: String
};
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to todolist"
});
const item2 = new Item({
  name: "Hit the + button to add a new item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});
const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemSchema]
};
const List = mongoose.model("List", listSchema);




app.get("/", function (req, res) {

  // Item.deleteMany({name: "Welcome to todolist"});

  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function (err) {
          if (err)
            console.log(err);
          else
            console.log("Successfully Inserted");
        });
        res.redirect("/");
      }
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

//POST FROM HOME ROUTE
app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list

  if (itemName != "")
  {
    
    const item = new Item({
      name: itemName
    });

    if(listName === "Today")
    {
      item.save();  
      res.redirect("/");
    }
    else
    {
      List.findOne({name: listName}, function(err, foundList){
        foundList.items.push(item)
        foundList.save();
        res.redirect("/"+listName);
      });
    }
  }
});

//POST from check box
app.post("/delete", function (req, res) {
  const checkItemId = req.body.checkbox;
  const Title = req.body.listName;

  if(Title === "Today"){
    Item.findByIdAndRemove(checkItemId, function (err) {
      if (!err) 
      {
        console.log("Sucessfully Deleted Document");
        res.redirect("/");
      }
      else
      {
            console.log(err);
      }
    });
  }
  else
  {
    List.findOneAndUpdate({name: Title}, {$pull: {items: {_id: checkItemId}}}, function(err, result){
      if(!err){
        res.redirect("/"+Title);
      }
    });
  }
});

//GET REQUEST from the search bar after host
app.get("/:newList", function (req, res) {
  const Title = _.capitalize(req.params.newList);

  const list = new List({
    name: Title,
    items: defaultItems
  });

  list.save();

  List.findOne({name: Title}, function (err, result) {
    if (!err)
    {
      if(!result)
      {//Create a new list
        const list = new List({
          name: Title,
          items: defaultItems
        });
        console.log("Succesfully created new list document");
        res.redirect("/"+list.name);
      }
      else
      {//Show existing list
        res.render("list", {
          listTitle: result.name,
          newListItems: result.items
        });
      }
    }
  });
});

//GET REQUEST from the about route
app.get("/about", function (req, res) {
  res.render("about");
});


app.listen(process.env.PORT||3000, function () {
  console.log("Server started successfully on port 3000");
});