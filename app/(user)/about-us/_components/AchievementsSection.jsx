// components/about/AchievementsSection.jsx
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CustomImage from "@/components/shared/customImage";

export default function AchievementsSection({ achievements }) {
  if (achievements.length === 0) return null;

  return (
    <section className="w-full">
      <h2 className="textNormal4 mb-4">Наши достижения</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map((achievement) => (
          <Dialog key={achievement.id}>
            <DialogTrigger asChild>
              <button className="text-left w-full">
                <div className="border rounded-md p-4 hover:shadow-md transition-shadow">
                  <div className="relative w-full aspect-[4/3] mb-2">
                    <CustomImage
                      src={achievement.image}
                      alt={achievement.title}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <h3 className="textSmall3 font-medium">
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {achievement.description}
                  </p>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent mark="false" className="w-11/12 rounded-md sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {achievement.title}
                  <span className="text-sm text-muted-foreground">
                    {new Date(achievement.created_at).toLocaleDateString(
                      "ru-RU"
                    )}
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative w-full h-64">
                  <CustomImage
                    src={achievement.image}
                    alt={achievement.title}
                    fill
                    className="object-contain rounded-md"
                  />
                </div>
                <DialogDescription className="text-gray-700">
                  {achievement.description}
                </DialogDescription>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </section>
  );
}
