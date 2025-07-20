import Image from 'next/image';

export default function BoltBadge() {
  return (
    <div className="fixed top-20 right-4 z-40">
      <a
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        className="block relative group cursor-pointer"
        title="Powered by Bolt.new"
      >
        <div className="absolute inset-0 bg-white/10 rounded-full group-hover:bg-white/20 transition-all duration-300"></div>
        <Image
          src="/white_circle_360x360.png"
          alt="Powered by Bolt.new"
          width={48}
          height={48}
          className="relative object-contain opacity-90 hover:opacity-100 transition-opacity duration-300 rounded-full"
        />
      </a>
    </div>
  );
}
