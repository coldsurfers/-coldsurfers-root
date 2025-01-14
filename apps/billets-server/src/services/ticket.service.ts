import { TicketDTO } from '@/dtos/ticket.dto'
import { TicketRepository } from '@/repositories/ticket.repository'

export class TicketService {
  private ticketRepository: TicketRepository

  constructor(ticketRepository: TicketRepository) {
    this.ticketRepository = ticketRepository
  }

  async getMany(params: { eventId: string }): Promise<TicketDTO[]> {
    return this.ticketRepository.findMany(params)
  }
}