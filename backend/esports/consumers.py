from channels.generic.websocket import AsyncJsonWebsocketConsumer

class MatchUpdatesConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.channel_layer.group_add("matches", self.channel_name)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("matches", self.channel_name)

    async def match_update(self, event):
        await self.send_json(event["content"])