"use client";
import React, { useEffect, useRef, useState } from "react";
import {
    Image as ImageIcon,
    Crop,
    Expand,
    Image as ImageUpscale, // no lucide-react upscale, using Image icon
    ImageMinus,
    Loader2Icon,
    X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ImageKit from "imagekit";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
    selectedEl: HTMLImageElement;
    clearSelection: () => void;
};

const transformOptions = [
    { label: "Smart Crop", value: "smartcrop", icon: <Crop />, transformation: 'fo-auto' },
    { label: "Resize", value: "resize", icon: <Expand />, transformation: 'e-dropshadow' },
    { label: "Upscale", value: "upscale", icon: <ImageUpscale />, transformation: 'e-upscale' },
    { label: "BG Remove", value: "bgremove", icon: <ImageMinus />, transformation: 'e-bgremove' },
];

var imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!
});

function ImageSettingSection({ selectedEl, clearSelection }: Props) {
    const [altText, setAltText] = useState(selectedEl.alt || "");
    const [width, setWidth] = useState<number>(selectedEl.width || 300);
    const [height, setHeight] = useState<number>(selectedEl.height || 200);
    const [loading, setLoading] = useState<"upload" | "generate" | "transform" | null>(null);
    const [selectedImage, setSelectedImage] = useState<File>();
    const [borderRadius, setBorderRadius] = useState(
        selectedEl.style.borderRadius || "0px"
    );
    const [preview, setPreview] = useState(selectedEl.src || "");
    const [activeTransforms, setActiveTransforms] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Sync state when selectedEl changes
    useEffect(() => {
        if (selectedEl) {
            setAltText(selectedEl.alt || "");
            setWidth(selectedEl.width || 300);
            setHeight(selectedEl.height || 200);
            setBorderRadius(selectedEl.style.borderRadius || "0px");
            setPreview(selectedEl.src || "");
        }
    }, [selectedEl]);

    // Toggle transform
    const toggleTransform = (value: string) => {
        setActiveTransforms((prev) =>
            prev.includes(value)
                ? prev.filter((t) => t !== value)
                : [...prev, value]
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const saveUploadedFile = async () => {
        if (selectedImage) {
            setLoading("upload")
            const imageRef = await imagekit.upload({
                // @ts-ignore
                file: selectedImage,
                fileName: Date.now() + ".png",
                isPublished: true
            })

            console.log(imageRef);
            const url = imageRef?.url + "?tr=";
            // @ts-ignore
            selectedEl.setAttribute('src', url)
            setPreview(url);
            setLoading(null)
        }
    }

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    const GenerateAiImage = () => {
        setLoading("generate");

        const url = `https://ik.imagekit.io/c8fffpbmak/ik-genimg-prompt-${altText}/${Date.now()}.png?tr=`
        setPreview(url);
        selectedEl.setAttribute('src', url)
    }

    const ApplyTransformation = (trValue: string) => {
        setLoading("transform");

        let newUrl = preview;
        if (!preview.includes(trValue)) {
            newUrl = preview + trValue + ','
        } else {
            newUrl = preview.replaceAll(trValue + ",", "");
        }
        
        setPreview(newUrl);
        selectedEl.setAttribute('src', newUrl)
    }

    return (
        <div className="w-96 shadow p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="flex gap-2 items-center font-bold">
                    <ImageIcon /> Image Settings
                </h2>
                <X className="cursor-pointer" onClick={clearSelection} />
            </div>

            {/* Preview (clickable) */}
            <div className="flex justify-center">
                <img
                    src={preview}
                    alt={altText}
                    className="max-h-40 object-contain border rounded cursor-pointer hover:opacity-80"
                    onClick={openFileDialog}
                    onLoad={() => setLoading(null)}
                />
            </div>

            {/* Hidden file input */}
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            {/* Upload Button */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={saveUploadedFile}
                disabled={!!loading}
            >
                {loading === "upload" && <Loader2Icon className="animate-spin" />}    Upload Image
            </Button>

            {/* Alt text */}
            <div>
                <label className="text-sm">Prompt</label>
                <Input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Enter alt text"
                    className="mt-1"
                />
            </div>

            <Button className="w-full" onClick={GenerateAiImage} disabled={!!loading}>{loading === "generate" && <Loader2Icon className="animate-spin" />} Generate AI Image</Button>

            {/* Transform Buttons */}
            <div>
                <label className="text-sm mb-1 block">AI Transform</label>
                <div className="flex gap-2 flex-wrap">
                    <TooltipProvider>
                        {transformOptions.map((opt) => {
                            const applied = activeTransforms.includes(opt.value);
                            return (
                                <Tooltip key={opt.value}>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant={preview.includes(opt.transformation) ? "default" : "outline"}
                                            className="flex items-center justify-center p-2"
                                            onClick={() => ApplyTransformation(opt.transformation)}
                                        >
                                            {opt.icon}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {opt.label} {applied && "(Applied)"}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </TooltipProvider>
                </div>
            </div>

            {/* Conditional Resize Inputs */}
            {activeTransforms.includes("resize") && (
                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="text-sm">Width</label>
                        <Input
                            type="number"
                            value={width}
                            onChange={(e) => setWidth(Number(e.target.value))}
                            className="mt-1"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-sm">Height</label>
                        <Input
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(Number(e.target.value))}
                            className="mt-1"
                        />
                    </div>
                </div>
            )}

            {/* Border Radius */}
            <div>
                <label className="text-sm">Border Radius</label>
                <Input
                    type="text"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(e.target.value)}
                    placeholder="e.g. 8px or 50%"
                    className="mt-1"
                />
            </div>
        </div>
    );
}

export default ImageSettingSection;