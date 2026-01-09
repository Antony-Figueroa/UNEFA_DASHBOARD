export default function ThreeColumnImageGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <div>
        <img
          src="/images/grid-image/image-04.png"
          alt=" grid"
          className="border border-border-light rounded-xl dark:border-border-dark"
        />
      </div>

      <div>
        <img
          src="/images/grid-image/image-05.png"
          alt=" grid"
          className="border border-border-light rounded-xl dark:border-border-dark"
        />
      </div>

      <div>
        <img
          src="/images/grid-image/image-06.png"
          alt=" grid"
          className="border border-border-light rounded-xl dark:border-border-dark"
        />
      </div>
    </div>
  );
}
