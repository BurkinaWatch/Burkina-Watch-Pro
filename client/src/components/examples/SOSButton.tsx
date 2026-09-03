import SOSButton from "../SOSButton";

export default function SOSButtonExample() {
  return (
    <div className="relative h-64 bg-muted/20 rounded-lg">
      <SOSButton onClick={() => console.log("SOS button clicked")} />
    </div>
  );
}
