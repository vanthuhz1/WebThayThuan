import BannerSlider from "../../components/Banner/BannerSlider";
import ProductCard from "../../components/Product/ProductCard";

const Home = () => {
  const products = [
    {
      id_products: 1,
      name: "Áo nỉ Atino form rộng",
      slug: "ao-ni-atino-form-rong",
      price: 790000,
      sale_price: 690000,
      stock_quantity: 20,
      created_at: new Date().toISOString(),
      rating: 4.9,
      review_count: 234,

      colors: [
        { name: "Đen", value: "Đen" },
        { name: "Nâu", value: "Nâu" },
        { name: "Be", value: "Be" },
        { name: "Xám", value: "Xám" },
      ],

      imagesByColor: {
        Đen: [
          "/assets/img/ps/Ao-So-Mi-Dai-Regular-L-3-4448-Den-Mf694.jpg",
          "/assets/img/ps/Ao-So-Mi-Dai-Regular-L-3-4448-Den-Mf694.jpg",
        ],
        Nâu: [
          "/assets/img/ps/Ao-So-Mi-Dai-Regular-L-3-4448-Nau-M93c0.jpg",
          "/assets/img/ps/Ao-So-Mi-Dai-Regular-L-3-4448-Nau-M93c0.jpg",
        ],
        Be: [
          "/assets/img/ps/Ao-So-Mi-Dai-Regular-L-3-4448-Be-M93c0.jpg",
          "/assets/img/ps/Ao-So-Mi-Dai-Regular-L-3-4448-Be-M93c0.jpg",
        ],
        Xám: [
          "/assets/img/ps/Ao-So-Mi-Dai-Regular-L-3-4448-Xam-M93c0.jpg",
          "/assets/img/ps/Ao-So-Mi-Dai-Regular-L-3-4448-Xam-M93c0.jpg",
        ],
      },
    },
  ];

  return (
    <>
      <BannerSlider />

      <div className="mx-auto max-w-7xl px-3 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard
              key={p.id_products}
              id={p.id_products}
              name={p.name}
              slug={p.slug}
              price={p.price}
              salePrice={p.sale_price}
              stockQuantity={p.stock_quantity}
              createdAt={p.created_at}
              rating={p.rating}
              reviewCount={p.review_count}
              imagesByColor={p.imagesByColor}
              colors={p.colors}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Home;
