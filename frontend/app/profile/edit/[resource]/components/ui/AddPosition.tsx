import { MdAdd } from "react-icons/md";
export default function AddPosition({onClick, prompt}: {onClick: () => void, prompt: string}){
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-3 border-2 border-dashed border-border rounded-lg text-muted hover:text-foreground hover:border-primary transition-all cursor-pointer flex items-center justify-center gap-2"
    >
      <MdAdd/>
      {prompt}
    </button>
  )
}