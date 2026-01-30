import ComponentCard from "../../components/common/ComponentCard";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import AspectRatioVideo from "../../components/ui/videos/AspectRatioVideo";

export default function Videos() {
  const demoVideoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ";

  return (
    <>
      <PageMeta
        title="Videos | UNEFA Dashboard"
        description="Videos UI elements page for UNEFA Dashboard"
      />
      <PageBreadcrumb pageTitle="Videos" />
      <div className="grid grid-cols-1 gap-5 sm:gap-6 xl:grid-cols-2">
        <div className="space-y-5 sm:space-y-6">
          <ComponentCard title="Video Ratio 16:9">
            <AspectRatioVideo videoUrl={demoVideoUrl} aspectRatio="video" />
          </ComponentCard>
          <ComponentCard title="Video Ratio 4:3">
            <AspectRatioVideo videoUrl={demoVideoUrl} aspectRatio="4/3" />
          </ComponentCard>
        </div>
        <div className="space-y-5 sm:space-y-6">
          <ComponentCard title="Video Ratio 21:9">
            <AspectRatioVideo videoUrl={demoVideoUrl} aspectRatio="21/9" />
          </ComponentCard>
          <ComponentCard title="Video Ratio 1:1">
            <AspectRatioVideo videoUrl={demoVideoUrl} aspectRatio="square" />
          </ComponentCard>
        </div>
      </div>
    </>
  );
}
