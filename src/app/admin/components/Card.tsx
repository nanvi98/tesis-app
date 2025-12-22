'use client';

interface CardProps {
  title: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}

export default function Card({ title, count, color, icon }: CardProps) {
  return (
    <div className={`p-5 rounded-2xl shadow-lg flex items-center justify-between ${color}`}>
      <div>
        <p className="font-semibold text-lg">{title}</p>
        <p className="text-2xl font-bold mt-1">{count}</p>
      </div>
      <div>{icon}</div>
    </div>
  );
}
