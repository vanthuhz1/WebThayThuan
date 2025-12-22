import { useRef, useState, useEffect } from "react";
import CategoryCard from "./CategoryCard";

export default function CategoryCarousel({ categories }) {
  const carouselRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const dragDistance = useRef(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position
  const checkScrollButtons = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollButtons();
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.addEventListener("scroll", checkScrollButtons);
    window.addEventListener("resize", checkScrollButtons);

    return () => {
      carousel.removeEventListener("scroll", checkScrollButtons);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, [categories]);

  // Mouse drag handlers
  const onMouseDown = (e) => {
    if (!carouselRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
    dragDistance.current = 0;
    carouselRef.current.style.cursor = "grabbing";
    carouselRef.current.style.userSelect = "none";
  };

  const onMouseLeave = () => {
    isDragging.current = false;
    if (carouselRef.current) {
      carouselRef.current.style.cursor = "grab";
      carouselRef.current.style.userSelect = "";
    }
  };

  const onMouseUp = () => {
    // If dragged more than 5px, prevent click events
    if (dragDistance.current > 5) {
      // Prevent click on cards
      const cards = carouselRef.current?.querySelectorAll('[data-category-card]');
      cards?.forEach((card) => {
        card.style.pointerEvents = 'none';
        setTimeout(() => {
          card.style.pointerEvents = '';
        }, 100);
      });
    }
    isDragging.current = false;
    dragDistance.current = 0;
    if (carouselRef.current) {
      carouselRef.current.style.cursor = "grab";
      carouselRef.current.style.userSelect = "";
    }
  };

  const onMouseMove = (e) => {
    if (!isDragging.current || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Scroll speed multiplier
    dragDistance.current += Math.abs(walk);
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Touch handlers for mobile
  const onTouchStart = (e) => {
    if (!carouselRef.current) return;
    isDragging.current = true;
    startX.current = e.touches[0].pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
  };

  const onTouchMove = (e) => {
    if (!isDragging.current || !carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const onTouchEnd = () => {
    isDragging.current = false;
  };

  // Navigation buttons
  const scrollTo = (direction) => {
    if (!carouselRef.current) return;
    const firstChild = carouselRef.current.children[0];
    if (!firstChild) return;
    
    const cardWidth = firstChild.offsetWidth;
    const gap = 24; // gap-6 = 24px
    const scrollAmount = cardWidth + gap;
    
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <div className="flex items-center justify-end gap-2 mb-6">
        <button
          type="button"
          onClick={() => scrollTo("left")}
          disabled={!canScrollLeft}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
            canScrollLeft
              ? "border-neutral-300 hover:bg-neutral-100 cursor-pointer"
              : "border-neutral-200 text-neutral-300 cursor-not-allowed"
          }`}
          aria-label="Previous"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scrollTo("right")}
          disabled={!canScrollRight}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
            canScrollRight
              ? "border-neutral-300 hover:bg-neutral-100 cursor-pointer"
              : "border-neutral-200 text-neutral-300 cursor-not-allowed"
          }`}
          aria-label="Next"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar cursor-grab active:cursor-grabbing"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {categories.map((category) => (
          <div
            key={category.idCategories ?? category.IdCategories}
            className="flex-none w-[280px] md:w-[320px] lg:w-[350px]"
            data-category-card
          >
            <CategoryCard category={category} />
          </div>
        ))}
      </div>
    </div>
  );
}

