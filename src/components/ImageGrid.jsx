import React from 'react';

function ImageGrid({ images = [] }) {
    if (!images || images.length === 0) return null;

    const getGridClass = (count) => {
        if (count === 1) return 'image-grid-1';
        if (count === 2) return 'image-grid-2';
        if (count === 3) return 'image-grid-3';
        if (count === 4) return 'image-grid-4';
        return 'image-grid-5'; // 5-9张图片使用3x3网格
    };

    const renderImage = (image, index) => {
        const isFirstImage = index === 0;
        const isWideImage = images.length === 1 || (images.length === 2 && index === 0);
        
        return (
            <div 
                key={index}
                className={`image-container ${isFirstImage && images.length === 3 ? 'row-span-2' : ''} ${isWideImage ? 'col-span-2' : ''}`}
                style={{
                    aspectRatio: isWideImage ? '16/9' : '1/1',
                    minHeight: isWideImage ? '120px' : '80px',
                    maxHeight: isWideImage ? '200px' : '120px'
                }}
            >
                <img
                    src={image.url || image}
                    alt={image.filename || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onClick={() => window.open(image.url || image, '_blank')}
                />
            </div>
        );
    };

    return (
        <div className={`image-grid ${getGridClass(images.length)}`}>
            {images.map((image, index) => renderImage(image, index))}
        </div>
    );
}

export default ImageGrid;
