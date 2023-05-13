const Menu = require("../../../models/menu");

function ordermaker() {
  return {
    async index(req, res) {
      res.render("add-menu");
    },

    async create(req, res) {
      const { name, image, description, price, categories, deliveryTime } = req.body;

      try {
        const product = await Menu.create({ name, image, description, price, categories, deliveryTime });
        res.redirect(`/products/${product.id}`);
      } catch (err) {
        console.error(err);
        res.render("/");
      }
    }
  };
}

module.exports =ordermaker