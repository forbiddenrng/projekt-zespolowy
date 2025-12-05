import Link from "next/link";
import { FaEdit } from "react-icons/fa";

interface EditButtonProps {
  href: string;
}

export default function EditButton({ href }: EditButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-200"
      title="Edytuj"
    >
      <FaEdit size={16} />
    </Link>
  );
}