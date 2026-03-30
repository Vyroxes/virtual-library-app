import { Slider } from "@mui/material";
import "./DoubleRangeSlider.css";

export default function DoubleRangeSlider({ initialBounds, filterCriteria, setFilterCriteria, isDisabled }) 
{
  const handleChange = (event, newValue) => 
  {
    setFilterCriteria({
      ...filterCriteria,
      minPages: newValue[0],
      maxPages: newValue[1]
    })
  }

  return (
    <div>
      <Slider
        value={[filterCriteria.minPages, filterCriteria.maxPages]}
        onChange={handleChange}
        min={initialBounds.minPages}
        max={initialBounds.maxPages}
        valueLabelDisplay="auto"
        disableSwap
        disabled={isDisabled}
      />
    </div>
  )
}