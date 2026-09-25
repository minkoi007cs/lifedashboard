import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AssistantConversation } from './assistant-conversation.entity';

@Entity('assistant_messages')
export class AssistantMessageEntity extends BaseEntity {
  @Column()
  role: 'user' | 'assistant';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-json', nullable: true })
  actions?: Record<string, unknown>[];

  @ManyToOne(() => AssistantConversation, (conv) => conv.messages, {
    onDelete: 'CASCADE',
  })
  conversation: AssistantConversation;

  @Column()
  conversationId: string;
}
