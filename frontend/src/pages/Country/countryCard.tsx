import React from "react";
import {
  Card,
  CardActions,
  CardContent,
  Button,
  Typography,
} from "@mui/material";

type Props = {
  countryCode: string;
  countryName: string;
  onClick: (countryCode: string) => Promise<void>;
};
function countryCard({ countryCode, countryName, onClick }: Props) {
  return (
    <Card
      sx={{
        marginBottom: "10px",
        marginRight: "10px",
        width: "400px",
        cursor: "pointer",
      }}
      onClick={() => onClick(countryCode)}
    >
      <CardContent>
        <img src={`https://flagsapi.com/${countryCode}/flat/64.png`} />
        <Typography variant="body2">{countryName}</Typography>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={() => onClick(countryCode)}>
          View Detail
        </Button>
      </CardActions>
    </Card>
  );
}

export default countryCard;
