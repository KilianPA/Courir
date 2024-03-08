const axios = require("axios");
const { toJSON } = require("dom-to-json");
const telegram = require("./lib/telegram");
const cheerio = require("cheerio");
const fs = require("fs");

const checkNewProducts = async () => {
  const productList = JSON.parse(fs.readFileSync("products.json"));
  const { data } = await axios.get(
    "https://www.courir.com/fr/c/chaussures/sneakers/marque/adidas/stan-smith/?prefn1=genderProduct&prefv1=FEMME&prefn2=size&prefv2=38&format=ajax"
  );
  const $ = cheerio.load(data);
  const products = [];
  $(".product__tile").each((i, el) => {
    const product = {
      id: $(el).attr("id"),
      link: `https://www.courir.com/${$(el)
        .find(".product__link")
        .attr("href")}`,
      name: $(el).find(".product__name__product").text(),
      price: $(el).find(".default-price").text(),
      image: $(el).find(".product__image > img").attr("src"),
    };
    products.push(product);
  });

  // Extract new products not in the list
  if (productList.length) {
    const newProducts = products.filter((p) => !productList.includes(p.id));
    if (newProducts.length === 0) {
      console.log("No new products found");
      return;
    } else {
      console.log("New products found");
      newProducts.forEach((p) => {
        telegram.sendMessage(`👟 ${p.name} - ${p.price} \n ${p.link}`);
      });
    }
  }

  fs.writeFileSync(
    "products.json",
    JSON.stringify(
      products.map((p) => p.id),
      null,
      2
    )
  );
};

(async () => {
  await checkNewProducts();
  setInterval(checkNewProducts, 1000 * 60);
})();
