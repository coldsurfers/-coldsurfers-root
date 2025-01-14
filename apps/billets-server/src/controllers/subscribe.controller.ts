import { ArtistDTO, SubscribeArtistBodyDTO, UnsubscribeArtistBodyDTO } from '@/dtos/artist.dto'
import { GetSubscribeCommonParamsDTO } from '@/dtos/common.dto'
import { ConcertDTO, GetSubscribedConcertListQueryStringDTO, SubscribeConcertParamsDTO } from '@/dtos/concert.dto'
import { ErrorResponseDTO } from '@/dtos/error-response.dto'
import { SubscribeVenueBodyDTO, UnsubscribeVenueBodyDTO, VenueDTO } from '@/dtos/venue.dto'
import { ArtistRepositoryImpl } from '@/repositories/artist.repository.impl'
import { ConcertRepositoryImpl } from '@/repositories/concert.repository.impl'
import { UserRepositoryImpl } from '@/repositories/user.repository.impl'
import { VenueRepositoryImpl } from '@/repositories/venue.repository.impl'
import { ArtistService } from '@/services/artist.service'
import { ConcertService } from '@/services/concert.service'
import { UserService } from '@/services/user.service'
import { VenueService } from '@/services/venue.service'
import { FastifyReply, FastifyRequest } from 'fastify'
import { RouteGenericInterface } from 'fastify/types/route'

const userRepository = new UserRepositoryImpl()
const userService = new UserService(userRepository)

const artistRepository = new ArtistRepositoryImpl()
const artistService = new ArtistService(artistRepository)

const venueRepository = new VenueRepositoryImpl()
const venueService = new VenueService(venueRepository)

const concertRepository = new ConcertRepositoryImpl()
const concertService = new ConcertService(concertRepository)

interface GetSubscribedConcertListRoute extends RouteGenericInterface {
  Querystring: GetSubscribedConcertListQueryStringDTO
  Reply: {
    200: ConcertDTO[]
    401: ErrorResponseDTO
    500: ErrorResponseDTO
  }
}

export const getSubscribedConcertListHandler = async (
  req: FastifyRequest<GetSubscribedConcertListRoute>,
  rep: FastifyReply<GetSubscribedConcertListRoute>,
) => {
  try {
    const user = await userService.getUserById(req.user.id)
    if (!user) {
      return rep.status(401).send({ code: 'INVALID_USER', message: 'Unauthorized' })
    }

    const { offset, size } = req.query

    const subscribedConcerts = await concertService.getManySubscribedConcerts({
      userId: user.id,
      take: +size,
      skip: +offset,
    })

    return rep.status(200).send(subscribedConcerts)
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface GetConcertSubscribeRoute extends RouteGenericInterface {
  Params: GetSubscribeCommonParamsDTO
  Reply: {
    200: ConcertDTO
    401: ErrorResponseDTO
    404: ErrorResponseDTO
    500: ErrorResponseDTO
  }
}

export const getConcertSubscribeHandler = async (
  req: FastifyRequest<GetConcertSubscribeRoute>,
  rep: FastifyReply<GetConcertSubscribeRoute>,
) => {
  try {
    const { id: concertId } = req.params
    const subscribedConcert = await concertService.getSubscribedConcert({ concertId, userId: req.user.id })
    if (!subscribedConcert) {
      return rep.status(404).send({
        code: 'SUBSCRIBED_CONCERT_NOT_FOUND',
        message: 'subscribed concert not found',
      })
    }
    return rep.status(200).send(subscribedConcert)
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface GetArtistSubscribeRoute extends RouteGenericInterface {
  Params: GetSubscribeCommonParamsDTO
  Reply: {
    200: ArtistDTO
    401: ErrorResponseDTO
    404: ErrorResponseDTO
    500: ErrorResponseDTO
  }
}

export const getArtistSubscribeHandler = async (
  req: FastifyRequest<GetArtistSubscribeRoute>,
  rep: FastifyReply<GetArtistSubscribeRoute>,
) => {
  try {
    const { id: artistId } = req.params
    const subscribedArtist = await artistService.getSubscribedArtist({ artistId, userId: req.user.id })
    if (!subscribedArtist) {
      return rep.status(404).send({
        code: 'SUBSCRIBED_ARTIST_NOT_FOUND',
        message: 'subscribed artist not found',
      })
    }
    return rep.status(200).send(subscribedArtist)
  } catch (e) {
    console.error(e)
    return rep.status(500).send({
      code: 'UNKNOWN',
      message: 'internal server error',
    })
  }
}

interface GetVenueSubscribeRoute extends RouteGenericInterface {
  Params: GetSubscribeCommonParamsDTO
  Reply: {
    200: VenueDTO
    401: ErrorResponseDTO
    404: ErrorResponseDTO
    500: ErrorResponseDTO
  }
}

export const getVenueSubscribeHandler = async (
  req: FastifyRequest<GetVenueSubscribeRoute>,
  rep: FastifyReply<GetVenueSubscribeRoute>,
) => {
  try {
    const { id: venueId } = req.params
    const subscribedVenue = await venueService.getVenueByVenueIdUserId({ venueId, userId: req.user.id })
    if (!subscribedVenue) {
      return rep.status(404).send({
        code: 'SUBSCRIBED_VENUE_NOT_FOUND',
        message: 'subscribed venue not found',
      })
    }
    return rep.status(200).send(subscribedVenue)
  } catch (e) {
    console.error(e)
    return rep.status(500).send({
      code: 'UNKNOWN',
      message: 'internal server error',
    })
  }
}

interface PostSubscribeConcertRoute extends RouteGenericInterface {
  Params: SubscribeConcertParamsDTO
  Reply: {
    200: ConcertDTO
    401: ErrorResponseDTO
    404: ErrorResponseDTO
    500: ErrorResponseDTO
  }
}

export const postSubscribeConcertHandler = async (
  req: FastifyRequest<PostSubscribeConcertRoute>,
  rep: FastifyReply<PostSubscribeConcertRoute>,
) => {
  try {
    const { id: concertId } = req.params

    const concert = await concertService.getById(concertId)
    if (!concert) {
      return rep.status(404).send({ code: 'CONCERT_NOT_FOUND', message: 'Concert not found' })
    }

    const subscribedConcert = await concertService.getSubscribedConcert({ concertId, userId: req.user.id })

    if (subscribedConcert) {
      return rep.status(200).send(subscribedConcert)
    }

    const newSubscribedConcert = await concertService.subscribe({
      concertId,
      userId: req.user.id,
    })

    return rep.status(200).send(newSubscribedConcert)
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface DeleteUnsubscribeConcertRoute extends RouteGenericInterface {
  Params: SubscribeConcertParamsDTO
  Reply: {
    200: ConcertDTO
    401: ErrorResponseDTO
    404: ErrorResponseDTO
    500: ErrorResponseDTO
  }
}

export const deleteUnsubscribeConcertHandler = async (
  req: FastifyRequest<DeleteUnsubscribeConcertRoute>,
  rep: FastifyReply<DeleteUnsubscribeConcertRoute>,
) => {
  try {
    const { id: concertId } = req.params

    const concert = await concertService.getById(concertId)
    if (!concert) {
      return rep.status(404).send({ code: 'CONCERT_NOT_FOUND', message: 'Concert not found' })
    }

    const subscribedConcert = await concertService.getSubscribedConcert({
      userId: req.user.id,
      concertId,
    })

    if (!subscribedConcert) {
      return rep.status(404).send({ code: 'SUBSCRIBED_CONCERT_NOT_FOUND', message: 'Concert not found' })
    }

    const data = await concertService.unsubscribe({ concertId, userId: req.user.id })

    return rep.status(200).send(data)
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface PostSubscribeArtistRoute extends RouteGenericInterface {
  Params: GetSubscribeCommonParamsDTO
  Body: SubscribeArtistBodyDTO
  Reply: {
    200: ArtistDTO
    401: ErrorResponseDTO
    404: ErrorResponseDTO
    500: ErrorResponseDTO
  }
}

export const postSubscribeArtistHandler = async (
  req: FastifyRequest<PostSubscribeArtistRoute>,
  rep: FastifyReply<PostSubscribeArtistRoute>,
) => {
  try {
    const { id: artistId } = req.params

    const artist = await artistService.findById(artistId)
    if (!artist) {
      return rep.status(404).send({ code: 'ARTIST_NOT_FOUND', message: 'Artist not found' })
    }

    const subscribedArtist = await artistService.getSubscribedArtist({ artistId, userId: req.user.id })

    if (subscribedArtist) {
      return rep.status(200).send(subscribedArtist)
    }

    const data = await artistService.subscribe({
      artistId,
      userId: req.user.id,
    })

    return rep.status(200).send(data)
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface DeleteUnsubscribeArtistRoute extends RouteGenericInterface {
  Params: GetSubscribeCommonParamsDTO
  Body: UnsubscribeArtistBodyDTO
  Reply: {
    200: ArtistDTO
    401: ErrorResponseDTO
    404: ErrorResponseDTO
    500: ErrorResponseDTO
  }
}

export const deleteUnsubscribeArtistHandler = async (
  req: FastifyRequest<DeleteUnsubscribeArtistRoute>,
  rep: FastifyReply,
) => {
  try {
    const { id: artistId } = req.params

    const artist = await artistService.findById(artistId)
    if (!artist) {
      return rep.status(404).send({ code: 'ARTIST_NOT_FOUND', message: 'Artist not found' })
    }

    const subscribedArtist = await artistService.getSubscribedArtist({ artistId, userId: req.user.id })

    if (!subscribedArtist) {
      return rep.status(404).send({ code: 'SUBSCRIBED_ARTIST_NOT_FOUND', message: 'Artist not found' })
    }

    const data = await artistService.unsubscribe({
      artistId,
      userId: req.user.id,
    })

    return rep.status(200).send(data)
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface PostSubscribeVenueRoute extends RouteGenericInterface {
  Params: GetSubscribeCommonParamsDTO
  Body: SubscribeVenueBodyDTO
  Reply: {
    200: VenueDTO
    401: ErrorResponseDTO
    404: ErrorResponseDTO
    500: ErrorResponseDTO
  }
}

export const postSubscribeVenueHandler = async (
  req: FastifyRequest<PostSubscribeVenueRoute>,
  rep: FastifyReply<PostSubscribeVenueRoute>,
) => {
  try {
    const { id: venueId } = req.params

    const venue = await venueService.getVenueById(venueId)
    if (!venue) {
      return rep.status(404).send({ code: 'VENUE_NOT_FOUND', message: 'Venue not found' })
    }

    const subscribedVenue = await venueService.getVenueByVenueIdUserId({ venueId, userId: req.user.id })

    if (subscribedVenue) {
      return rep.status(200).send(subscribedVenue)
    }

    const data = await venueService.subscribe({ venueId, userId: req.user.id })

    return rep.status(200).send(data)
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}

interface DeleteUnsubscribeVenueRoute extends RouteGenericInterface {
  Params: GetSubscribeCommonParamsDTO
  Body: UnsubscribeVenueBodyDTO
  Reply: {
    200: VenueDTO
    401: ErrorResponseDTO
    404: ErrorResponseDTO
    500: ErrorResponseDTO
  }
}

export const deleteUnsubscribeVenueHandler = async (
  req: FastifyRequest<DeleteUnsubscribeVenueRoute>,
  rep: FastifyReply<DeleteUnsubscribeVenueRoute>,
) => {
  try {
    const { id: venueId } = req.params

    const venue = await venueService.getVenueById(venueId)
    if (!venue) {
      return rep.status(404).send({ code: 'VENUE_NOT_FOUND', message: 'Venue not found' })
    }

    const subscribedVenue = await venueService.getVenueByVenueIdUserId({ venueId, userId: req.user.id })

    if (!subscribedVenue) {
      return rep.status(404).send({ code: 'SUBSCRIBED_VENUE_NOT_FOUND', message: 'Venue not found' })
    }

    const data = await venueService.unsubscribe({ venueId, userId: req.user.id })

    return rep.status(200).send(data)
  } catch (e) {
    console.error(e)
    return rep.status(500).send({ code: 'UNKNOWN', message: 'internal server error' })
  }
}