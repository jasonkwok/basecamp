import Image from "next/image";

export default function ExplorerBrand() {
  return (
    <header className="atlas-brand">
      <span className="brand-mark" aria-hidden="true">
        <Image
          src="/mountain-marker.svg"
          alt=""
          width={120}
          height={96}
          priority
        />
      </span>

      <div>
        <h1>
          Basecamp<span className="brand-dot">.</span>
        </h1>
        <p>Your next adventure starts here.</p>
      </div>
    </header>
  );
}
