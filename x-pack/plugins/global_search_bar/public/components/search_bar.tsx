/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiSelectableTemplateSitewide,
  EuiLink,
} from '@elastic/eui';
import { ApplicationStart } from 'kibana/public';
import { FormattedMessage } from '@kbn/i18n/react';
import { i18n } from '@kbn/i18n';
import { GlobalSearchResultProvider, GlobalSearchResult } from '../../../global_search/public';

interface Props {
  globalSearch: GlobalSearchResultProvider;
  navigateToUrl: ApplicationStart['navigateToUrl'];
}

export function SearchBar({ globalSearch, navigateToUrl }: Props) {
  const [options, setOptions] = useState([] as GlobalSearchResult[]);
  const [isLoading, setLoadingState] = useState(false);
  const [searchRef, setSearchRef] = useState<HTMLInputElement | null>(null);
  const isWindows = navigator.platform.toLowerCase().indexOf('win') >= 0;

  const onSearch = useCallback(
    (term: string) => {
      const arr: GlobalSearchResult[] = [];
      setLoadingState(true);
      globalSearch.find(term, {}).subscribe({
        next: ({ results }) => {
          arr.push(...results);
          setOptions([...arr]);
        },
        error: () => {
          // TODO
        },
        complete: () => {
          setLoadingState(false);
        },
      });
    },
    [globalSearch]
  );

  useEffect(() => {
    onSearch('');
  }, [onSearch]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if (event.key === 'k' && (isWindows ? event.ctrlKey : event.metaKey)) {
        if (searchRef) searchRef.focus();
      }
    };
    window.addEventListener('keydown', openSearch);

    return () => {
      window.removeEventListener('keydown', openSearch);
    };
  }, [searchRef, isWindows]);

  return (
    <EuiSelectableTemplateSitewide
      isLoading={isLoading}
      singleSelection={true}
      // @ts-ignore Have some type errors in EUI
      options={options.map((option) => ({
        ...option,
        key: option.id,
        label: option.title,
        icon: {
          type: option.icon,
        },
        meta: [
          {
            text: option.type,
            type: option.type,
          },
          {
            text: option.meta,
          },
        ],
      }))}
      searchProps={{
        onSearch,
        'data-test-subj': 'header-search',
        append: '⌘K',
        compressed: true,
        incremental: true,
        className: 'customSearchClass',
        // inputRef: (ref: HTMLInputElement) => {
        //   setSearchRef(ref);
        // },
        'aria-label': i18n.translate('core.ui.primaryNav.screenReaderLabel', {
          defaultMessage: 'Search for anything...',
        }),
      }}
      onChange={(selected) => {
        const { url } = selected.find(({ checked }) => checked === 'on');

        if (typeof url === 'string') {
          if (url.startsWith('https://')) {
            // if absolute path
            window.location.assign(url);
          } else {
            // else is relative path
            navigateToUrl(url);
          }
        } else {
          // else is url obj
          // TODO
        }
      }}
      popoverFooter={
        <EuiText color="subdued" size="xs">
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false} wrap>
            <EuiFlexItem grow={false}>{false && <EuiLink>View more results</EuiLink>}</EuiFlexItem>
            <EuiFlexItem />
            <EuiFlexItem grow={false}>
              <FormattedMessage id="searchBar.shortcut" defaultMessage="Quickly search using" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge>{!isWindows ? 'Command + K' : 'Ctrl + K'}</EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiText>
      }
    />
  );
}
