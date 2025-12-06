export default function SaveButton({isSubmitting}: {isSubmitting: boolean}){
  return (
  <button
    type="submit"
    disabled={isSubmitting}
    className="px-6 py-3 bg-primary text-secondary hover:bg-primary/90 rounded-lg font-medium transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isSubmitting ? "Zapisuje..." : "Zapisz"}
  </button>
  )
}