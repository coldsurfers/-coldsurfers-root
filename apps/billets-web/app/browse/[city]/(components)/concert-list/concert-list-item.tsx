import { format } from 'date-fns'
import Link from 'next/link'
import { memo, useMemo } from 'react'
import { components } from 'types/api'
import {
  StyledGridDate,
  StyledGridImage,
  StyledGridItem,
  StyledGridTextContainer,
  StyledGridTitle,
  StyledVenueText,
} from './concert-list.styled'

export const ConcertListItem = memo(({ data }: { data: components['schemas']['ConcertDTOSchema'] }) => {
  const formattedDate = useMemo(() => {
    if (!data.date) {
      return ''
    }
    return format(new Date(data.date), 'EEE, MMM dd')
  }, [data.date])
  const thumbUrl = useMemo(() => {
    if (!data.mainPoster) {
      return ''
    }
    return `${data.mainPoster.url}&width=300&height=300`
  }, [data.mainPoster])
  return (
    <Link href={`/event/${data.id}`}>
      <StyledGridItem>
        <StyledGridImage src={thumbUrl} alt={data.title} />
        <StyledGridTextContainer>
          <StyledGridTitle as="p">{data.title}</StyledGridTitle>
          <StyledGridDate as="p">{formattedDate}</StyledGridDate>
          {data.mainVenue?.name && <StyledVenueText as="p">{data.mainVenue.name}</StyledVenueText>}
        </StyledGridTextContainer>
      </StyledGridItem>
    </Link>
  )
})
