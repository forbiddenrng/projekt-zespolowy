import Link from "next/link";

export default function Logo(){
  return (
    <Link href="/" className="flex items-center group">
      <span className="font-bold text-foreground group-hover:text-primary transition-colors duration-200">
        JobMatch<span className="text-primary">.AI</span>
      </span>
    </Link>
  )
}