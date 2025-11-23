import React, { useState } from 'react';
import { StarFilled } from "@ant-design/icons";

const StarRating = ({ value, onChange, readOnly = false }) => {
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '8px', cursor: readOnly ? 'default' : 'pointer' }}>
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        const isActive = ratingValue <= (hover || value);

        return (
          <StarFilled
            key={index}
            className="custom-star"
            style={{
              fontSize: '36px',
              color: isActive ? '#fadb14' : '#e0e0e0',
              transition: 'color 0.2s, transform 0.2s',
            }}
            onMouseEnter={() => !readOnly && setHover(ratingValue)}
            onMouseLeave={() => !readOnly && setHover(0)}
            onClick={() => !readOnly && onChange(ratingValue)}
          />
        );
      })}
    </div>
  );
};

export default StarRating;