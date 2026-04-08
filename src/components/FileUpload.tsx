import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import type { FileWithPreview, AnalyzeMode } from '../types';

interface FileUploadProps {
  analyzeMode: AnalyzeMode;
  allFiles: FileWithPreview[];
  setAllFiles: (files: FileWithPreview[]) => void;
  onLightbox: (src: string) => void;
}

export const FileUpload = ({ analyzeMode, allFiles, setAllFiles, onLightbox }: FileUploadProps) => {
  const displayFiles = analyzeMode === 'single' && allFiles.length > 0 ? [allFiles[0]] : allFiles;
  const isDropzoneDisabled = analyzeMode === 'single' && allFiles.length >= 1;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const newFiles = acceptedFiles.map(f => Object.assign(f, { preview: URL.createObjectURL(f) })) as FileWithPreview[];
    const filesToAdd = analyzeMode === 'single' ? [newFiles[0]] : newFiles;
    const valid = filesToAdd.filter(Boolean);
    if (valid.length > 0) setAllFiles([...allFiles, ...valid]);
  }, [analyzeMode, allFiles, setAllFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: analyzeMode === 'multiple',
    disabled: isDropzoneDisabled,
  } as any);

  const removeFile = (index: number) => setAllFiles(allFiles.filter((_, i) => i !== index));

  return (
    <>
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-2">
        <div {...getRootProps()}
          className={`border-[1.5px] border-dashed rounded-[22px] p-10 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[280px]
            ${isDropzoneDisabled ? 'border-zinc-200 bg-zinc-50 opacity-60 cursor-not-allowed' : isDragActive ? 'border-zinc-900 bg-zinc-100 cursor-pointer' : 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-100 cursor-pointer bg-zinc-50/50'}`}>
          <input {...(getInputProps() as any)} />
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${isDropzoneDisabled ? 'bg-zinc-100 text-zinc-400' : isDragActive ? 'bg-zinc-900 text-white' : 'bg-white shadow-sm text-zinc-600'}`}>
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{analyzeMode === 'single' ? '上传单张设计图' : '上传多张竞品图'}</h3>
          <p className="text-zinc-500 text-sm leading-relaxed max-w-[260px]">
            {isDropzoneDisabled
              ? '已选择图片。如需更改，请先删除下方图片。'
              : analyzeMode === 'single' ? '点击或拖拽至此处，进行深入的视觉与交互剖析' : '支持拖拽多张图片进行深度横向对比'}
          </p>
        </div>
      </div>

      {displayFiles.length > 0 && (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-500" />已选内容
            </h3>
            <span className="text-xs font-medium px-2 py-1 bg-zinc-100 rounded-md text-zinc-600">{displayFiles.length} 张图片</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-3">
            {displayFiles.map((file, index) => (
              <div key={`${file.preview}-${index}`} className="relative group aspect-square p-1">
                <div className="w-full h-full rounded-xl overflow-hidden border border-[#eeeeee] bg-zinc-50 relative">
                  <img src={file.preview} alt={`preview-${index}`} className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center cursor-zoom-in" onClick={() => onLightbox(file.preview)}>
                    <div className="w-8 h-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-zinc-800 font-bold text-xs">🔍</span>
                    </div>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); removeFile(index); }}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white shadow-md border border-zinc-100 text-zinc-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-50 hover:text-red-500 z-10">
                  <X className="w-3 h-3" />
                </button>
                {analyzeMode === 'multiple' && (
                  <div className="absolute -bottom-1.5 -left-1.5 bg-zinc-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">图{index + 1}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};