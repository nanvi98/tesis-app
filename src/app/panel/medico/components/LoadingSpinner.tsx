export default function LoadingSpinner() {
  return (
    <div className="w-full flex justify-center py-6">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-500 border-t-transparent"></div>
    </div>
  );
}
