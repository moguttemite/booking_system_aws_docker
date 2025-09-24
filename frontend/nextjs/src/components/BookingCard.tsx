// /components/BookingCard.tsx

import Image from "next/image";

export default function BookingCard({ booking }: { booking: any }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-md transition">
      <div className="flex items-center gap-4">
        <Image
          src={booking.teacher_profile_image || "/test.png"}
          alt="講師画像"
          width={60}
          height={60}
          className="rounded-full"
        />
        <div>
          <h2 className="text-lg font-semibold">{booking.lecture_title}</h2>
          <p className="text-sm text-gray-500">講師：{booking.teacher_name}</p>
          <p className="text-sm">日付：{booking.date}</p>
          <p className="text-sm">
            時間：{booking.start_time}〜{booking.end_time}
          </p>
          <p className="text-sm">場所：{booking.location}</p>
        </div>
      </div>
      <button className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        予約する
      </button>
    </div>
  );
}
