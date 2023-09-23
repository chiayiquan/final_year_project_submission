import React from "react";
import {
  Card,
  CardActions,
  CardContent,
  Button,
  Typography,
} from "@mui/material";
import { SubscriptionSchema } from "../../models/Donation";

type Props = {
  subscriptions: SubscriptionSchema[];
  cancelSubscription: (id: string) => Promise<void>;
};
function subscription({ subscriptions, cancelSubscription }: Props) {
  const CustomCard = ({
    id,
    cancelAt,
    startDate,
    status,
    amount,
    productName,
  }: SubscriptionSchema) => (
    <Card sx={{ marginBottom: "10px", marginRight: "10px", width: "400px" }}>
      <CardContent>
        <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
          Recurring Donation
        </Typography>
        <Typography variant="h5" component="div">
          {productName}
        </Typography>
        <Typography sx={{ mb: 1.5 }} color="text.secondary">
          Status: {status}
        </Typography>
        <Typography variant="body2">
          Amount: ${amount}
          <br />
          Start Date: {startDate}
          <br />
          {cancelAt != null && `Cancel Date: ${cancelAt}`}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          color="error"
          onClick={() => cancelSubscription(id)}
        >
          Cancel Subscription
        </Button>
      </CardActions>
    </Card>
  );
  return (
    <div className="flex flex-wrap">
      {subscriptions.map((sub) => (
        <CustomCard {...sub} key={sub.id} />
      ))}
    </div>
  );
}

export default subscription;
