// // components/TeacherCardServer.tsx
// import TeacherCard from "./TeacherCard";

// type Props = {
//   teacherId: string;
// };

// async function getTeacherData(teacherId: string) {
//   return {
//     img_src: "./test.png",
//     selfIntro: "こんにちは。私はMagic教師として、楽しく実践的な授業を心がけています。" + teacherId,
//     lectureIntro: "この講座では、日常会話からビジネスまで幅広い表現を学ぶことができます。" + teacherId,
//   };
// }

// export default async function TeacherCardServer({ teacherId }: Props) {
//   const data = await getTeacherData(teacherId);
//   return <TeacherCard {...data} />;
// }
