var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require("cli-table");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,

  user: "root",

  password: "jayhawk",
  database: "bamazon_db"
});

connection.connect(function(err) {
  if (err) throw err;

  console.log("Connected as id: " + connection.threadId);
  displayProducts();
});

function displayProducts() {
  connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;

    console.log("\n--------------------------\n");
    console.log("Available Bamazon Products");
    console.log("\n--------------------------\n");

    var table = new Table({
      head: [
        "Product ID",
        "Product",
        "Department",
        "Price",
        "Stock \nQuantity"
      ],
      colWidths: [10, 50, 30, 10, 10]
    });

    for (var i = 0; i < results.length; i++) {
      var infoArray = [
        results[i].item_id,
        results[i].product_name,
        results[i].department_name,
        results[i].price,
        results[i].stock_quantity
      ];

      table.push(infoArray);
    }

    console.log(table.toString());

    shoppingCart(results);
  });
}

function shoppingCart(results) {
  inquirer
    .prompt({
      name: "choiceId",
      type: "input",
      message:
        "Select a product to order by entering the Item ID. [Quit with Q]"
    })
    .then(function(answer) {
      if (answer.choiceId.toLowerCase() == "q") {
        console.log("\nThank you for visiting Bamazon.");
        process.exit();
      }

      for (var i = 0; i < results.length; i++) {
        if (results[i].item_id == answer.choiceId) {
          var product = results[i].product_name;
          var choice = answer.choiceId;
          var id = i;

          console.log("\nYou selected " + product + "\n");

          inquirer
            .prompt([
              {
                name: "quantity",
                type: "input",
                message: "How many would you like to buy? [Quit with Q]",
                validate: function(value) {
                  if (isNaN(value) == false) {
                    return true;
                  } else {
                    return false;
                  }
                }
              }
            ])
            .then(function(answer) {
              var num = answer.quantity;
              var diff = results[id].stock_quantity - num;

              
              var formatNumber = function(num) {
                return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
              };

              
              var totalCost = parseFloat(results[id].price * num).toFixed(2);

              if (diff >= 0) {
                connection.query(
                  "UPDATE products SET stock_quantity = '" +
                    diff +
                    "' WHERE item_id='" +
                    choice +
                    "'",
                  function(err, resultsTwo) {
                    if (err) throw err;

                    makeTable(results);

                    function message() {
                      console.log(
                        "\nYou have successfully purchased " +
                          num +
                          " of " +
                          product
                      );
                      console.log(
                        "The total of your purchase is: $" +
                          formatNumber(totalCost) +
                          "\n"
                      );
                    }

                    setTimeout(message, 250);
                    setTimeout(orderMore, 300);
                  }
                );
              } else {
                console.log(
                  "\nInsufficiant quantity of " +
                    product +
                    ". Please try again.\n"
                );
                shoppingCart(results);
              }
            });
        }
      }
    });
}

function makeTable(results) {
  var table = new Table({
    head: ["Product ID", "Product", "Department", "Price", "Stock \nQuantity"],
    colWidths: [10, 50, 30, 10, 10]
  });

  for (var i = 0; i < results.length; i++) {
    var infoArray = [
      results[i].item_id,
      results[i].product_name,
      results[i].department_name,
      results[i].price,
      results[i].stock_quantity
    ];
    table.push(infoArray);
  }

  console.log(table.toString());
}

function orderMore() {
  inquirer
    .prompt({
      name: "continue",
      type: "confirm",
      message: "Would you like to order another product?"
    })
    .then(function(answer) {
      if (answer.continue == true) {
        displayProducts();
      } else {
        console.log("Thank you for shopping with Bamazon.");
        process.exit();
      }
    });
}
