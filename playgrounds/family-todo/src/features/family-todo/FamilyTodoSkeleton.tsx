export function FamilyTodoSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-12 rounded bg-gray-200" />
      ))}
    </div>
  );
}
