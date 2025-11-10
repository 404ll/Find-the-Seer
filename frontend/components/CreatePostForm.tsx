import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CreatePostForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
      <Card className="relative max-w-2xl bg-white rounded-[12px] p-6 flex flex-col gap-6 text-black font-cbyg border border-gray-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <span className="text-gray-600 text-xl font-cbyg">X</span>
        </button>

        <CardContent className="flex flex-col gap-6 p-0">
          <div className="flex items-center gap-4">
            <label className="text-2xl font-cbyg whitespace-nowrap">Content:</label>
            <Input 
              type="text" 
              className="flex-1 bg-gray-100 border-gray-200 rounded-md font-cbyg text-xl" 
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-2xl font-cbyg whitespace-nowrap">Truth ratio:</label>
            <div className="flex-1 text-2xl font-cbyg">7/3</div>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-2xl font-cbyg whitespace-nowrap">Epoch :</label>
            <Input 
              type="text" 
              className="flex-1 bg-gray-100 border-gray-200 rounded-md font-cbyg text-xl" 
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-2xl font-cbyg whitespace-nowrap">Image :</label>
            <Input 
              type="text" 
              className="flex-1 bg-gray-100 border-gray-200 rounded-md font-cbyg text-xl" 
            />
          </div>
        </CardContent>

        <div className="flex justify-end">
          <Button
            //   onClick={onCreate}
            className="bg-black text-white rounded-md px-6 py-2 font-cbyg text-2xl"
          >
            Create
          </Button>
        </div>
      </Card>
    </div>
  );
}
