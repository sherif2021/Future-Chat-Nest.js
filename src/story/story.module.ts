import { Module } from '@nestjs/common';
import { StoryService } from './story.service';
import { StoryController } from './story.controller';
import { Story, StorySchema } from './entities/story.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { Contact, ContactSchema } from 'src/chat/entities/contact.entity';

@Module({
  controllers: [StoryController],
  providers: [StoryService],
  imports: [
    MongooseModule.forFeature([
      { name: Story.name, schema: StorySchema },
      { name: User.name, schema: UserSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ]
})
export class StoryModule { }
